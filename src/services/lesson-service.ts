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
}) {
  const { room, subject, teacherId, startTime, endTime } = input;

  return db.lesson.create({
    data: {
      room,
      subject,
      teacherId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      opened: false,
      closed: false,
    },
    include: { teacher: { select: { id: true, name: true, email: true } } },
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
