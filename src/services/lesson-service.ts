import { db } from '@/db.js';
import { ServiceError } from '@/errors/service-error.js';

const lessonInclude = {
  teacher: { select: { id: true, name: true, email: true } },
  students: {
    include: { student: { select: { id: true, name: true, tagId: true } } },
  },
} as const;

const studentSelect = { id: true, name: true, tagId: true } as const;

export async function listLessons() {
  return db.lesson.findMany({ include: lessonInclude });
}

export async function listTeacherLessons(teacherId: number) {
  return db.lesson.findMany({ where: { teacherId }, include: lessonInclude });
}

export async function createLesson(input: {
  room: string;
  subject: string;
  teacherId: number;
  startTime: string;
  endTime: string;
  students?: number[] | undefined;
}) {
  const { room, subject, teacherId, startTime, endTime, students } = input;

  const lesson = await db.lesson.create({
    data: {
      room,
      subject,
      teacherId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      opened: false,
      closed: false,
    },
  });

  // Se vier lista de alunos, associe-os (upsert para idempotência)
  if (students && students.length > 0) {
    for (const studentId of students) {
      await db.lessonStudent.upsert({
        where: { lessonId_studentId: { lessonId: lesson.id, studentId } },
        create: { lessonId: lesson.id, studentId, present: false },
        update: {},
      });
    }
  }

  // Retornar aula com teacher e alunos
  return db.lesson.findUnique({
    where: { id: lesson.id },
    include: lessonInclude,
  });
}

export async function getLessonById(id: number) {
  const lesson = await db.lesson.findUnique({
    where: { id },
    include: lessonInclude,
  });
  if (!lesson) throw new ServiceError(404, 'Aula não encontrada');

  return lesson;
}

export async function openLesson(id: number) {
  return db.lesson.update({
    where: { id },
    data: { opened: true, closed: false },
    include: { teacher: { select: { id: true, name: true, email: true } } },
  });
}

export async function closeLesson(id: number) {
  return db.lesson.update({
    where: { id },
    data: { opened: false, closed: true },
    include: { teacher: { select: { id: true, name: true, email: true } } },
  });
}

async function ensureLessonOpened(id: number) {
  const lesson = await db.lesson.findUnique({ where: { id } });

  if (!lesson) throw new ServiceError(404, 'Aula não encontrada');
  if (!lesson.opened)
    throw new ServiceError(
      400,
      'Aula não está aberta para marcação de presença',
    );

  return lesson;
}

export async function getLessonStudents(id: number) {
  return db.lessonStudent.findMany({
    where: { lessonId: id },
    include: { student: { select: studentSelect } },
  });
}

export async function markAttendance(
  lessonId: number,
  studentId: number,
  present: boolean,
) {
  await ensureLessonOpened(lessonId);

  return db.lessonStudent.upsert({
    where: { lessonId_studentId: { lessonId, studentId } },
    update: { present },
    create: { lessonId, studentId, present },
    include: { student: { select: studentSelect } },
  });
}

export async function markAttendanceByTag(lessonId: number, tagId: string) {
  await ensureLessonOpened(lessonId);

  const student = await db.student.findUnique({ where: { tagId } });
  if (!student) throw new ServiceError(404, 'Aluno não encontrado');

  return db.lessonStudent.upsert({
    where: { lessonId_studentId: { lessonId, studentId: student.id } },
    update: { present: true },
    create: { lessonId, studentId: student.id, present: true },
    include: { student: { select: studentSelect } },
  });
}

export async function updateLesson(
  id: number,
  data: {
    room?: string | undefined;
    subject?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
  },
) {
  const existing = await db.lesson.findUnique({ where: { id } });
  if (!existing) throw new ServiceError(404, 'Aula não encontrada');

  const updateData: any = {};
  if (data.room !== undefined) updateData.room = data.room;
  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.startTime !== undefined)
    updateData.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);

  return db.lesson.update({
    where: { id },
    data: updateData,
    include: { teacher: { select: { id: true, name: true, email: true } } },
  });
}

export async function deleteLesson(id: number) {
  const existing = await db.lesson.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new ServiceError(404, 'Aula não encontrada');

  await db.$transaction([
    db.lessonStudent.deleteMany({ where: { lessonId: id } }),
    db.lesson.delete({ where: { id } }),
  ]);

  return { success: true };
}

export async function generateRecurringLessons(input: {
  room: string;
  subject: string;
  teacherId: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  startHour: string; // HH:mm
  endHour: string; // HH:mm
  weekdays: number[]; // 0..6 (0=Domingo)
}) {
  const { room, subject, teacherId, from, to, startHour, endHour, weekdays } =
    input;

  // Sanidade: from <= to
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T23:59:59Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new ServiceError(400, 'Intervalo de datas inválido');
  }
  if (fromDate > toDate) {
    throw new ServiceError(400, 'Data inicial maior que data final');
  }

  // Utilitário para construir Date UTC para a data e hora dadas
  const buildDateTimeUTC = (d: Date, hhmm: string) => {
    const [hh, mm] = hhmm.split(':').map((s) => parseInt(s, 10));
    const dt = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh, mm, 0),
    );
    return dt;
  };

  const created: any[] = [];
  let skipped = 0;

  // Iterar dias no intervalo
  for (
    let t = fromDate.getTime();
    t <= toDate.getTime();
    t += 24 * 60 * 60 * 1000
  ) {
    const day = new Date(t);
    const weekDay = day.getUTCDay();
    if (!weekdays.includes(weekDay)) continue;

    const startTime = buildDateTimeUTC(day, startHour);
    const endTime = buildDateTimeUTC(day, endHour);

    // Evitar duplicar ocorrência já existente (mesmo teacherId + startTime)
    const existing = await db.lesson.findFirst({
      where: { teacherId, startTime },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const lesson = await db.lesson.create({
      data: {
        room,
        subject,
        teacherId,
        startTime,
        endTime,
        opened: false,
        closed: false,
      },
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });
    created.push(lesson);
  }

  return {
    createdCount: created.length,
    skippedCount: skipped,
    lessons: created,
  };
}

export async function addStudentToLesson(lessonId: number, studentId: number) {
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new ServiceError(404, 'Aula não encontrada');

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) throw new ServiceError(404, 'Aluno não encontrado');

  // Upsert para evitar duplicação
  const attendance = await db.lessonStudent.upsert({
    where: { lessonId_studentId: { lessonId, studentId } },
    create: { lessonId, studentId, present: false },
    update: {},
    include: { student: { select: { id: true, name: true, tagId: true } } },
  });

  return attendance;
}

export async function removeStudentFromLesson(
  lessonId: number,
  studentId: number,
) {
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new ServiceError(404, 'Aula não encontrada');

  const existing = await db.lessonStudent.findUnique({
    where: { lessonId_studentId: { lessonId, studentId } },
    select: { id: true },
  });
  if (!existing)
    throw new ServiceError(404, 'Associação aluno-aula não encontrada');

  await db.lessonStudent.delete({ where: { id: existing.id } });
  return { success: true };
}
