import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';
import {
  validatePostRequest,
  sendValidationError,
} from '@/utils/validation.js';

// Listar todas as aulas
export async function getLessons(request: FastifyRequest, reply: FastifyReply) {
  const lessons = await db.lesson.findMany({
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      students: {
        include: {
          student: {
            select: { id: true, name: true, tagId: true },
          },
        },
      },
    },
  });
  reply.send(lessons);
}

// Listar aulas de um professor específico
export async function getTeacherLessons(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { teacherId } = request.params as { teacherId: string };

  const lessons = await db.lesson.findMany({
    where: { teacherId: parseInt(teacherId) },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      students: {
        include: {
          student: {
            select: { id: true, name: true, tagId: true },
          },
        },
      },
    },
  });

  reply.send(lessons);
}

// Criar nova aula
export async function createLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = request.body as any;

    // Validação de campos obrigatórios
    const validation = validatePostRequest(
      body,
      ['room', 'subject', 'teacherId', 'startTime', 'endTime'],
      {
        room: 'string',
        subject: 'string',
        teacherId: 'number',
        startTime: 'string',
        endTime: 'string',
      },
      {
        room: { min: 1, max: 50 },
        subject: { min: 2, max: 100 },
        startTime: { min: 10, max: 30 },
        endTime: { min: 10, max: 30 },
      },
    );

    if (!validation.isValid) {
      return sendValidationError(reply, validation);
    }

    const { room, subject, teacherId, startTime, endTime } = body;

    // Verifica se o professor existe
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return reply.status(404).send({
        error: 'Professor não encontrado',
        code: 'TEACHER_NOT_FOUND',
      });
    }

    // Valida se as datas são válidas
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return reply.status(400).send({
        error: 'Datas inválidas',
        code: 'INVALID_DATES',
      });
    }

    if (startDate >= endDate) {
      return reply.status(400).send({
        error: 'Data de início deve ser anterior à data de fim',
        code: 'INVALID_DATE_RANGE',
      });
    }

    const lesson = await db.lesson.create({
      data: {
        room,
        subject,
        teacherId,
        startTime: startDate,
        endTime: endDate,
        opened: false,
        closed: false,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    reply.code(201).send(lesson);
  } catch (error) {
    console.error('Erro ao criar lição:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

// Obter aula específica
export async function getLesson(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const lesson = await db.lesson.findUnique({
    where: { id: parseInt(id) },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      students: {
        include: {
          student: {
            select: { id: true, name: true, tagId: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    return reply.code(404).send({ error: 'Aula não encontrada' });
  }

  reply.send(lesson);
}

// Abrir aula (permitir marcação de presença)
export async function openLesson(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const lesson = await db.lesson.update({
    where: { id: parseInt(id) },
    data: { opened: true, closed: false },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  reply.send(lesson);
}

// Fechar aula (finalizar marcação de presença)
export async function closeLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const lesson = await db.lesson.update({
    where: { id: parseInt(id) },
    data: { opened: false, closed: true },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  reply.send(lesson);
}

// Marcar presença de um aluno
export async function markAttendance(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    // Validação de campos obrigatórios
    const validation = validatePostRequest(body, ['studentId', 'present'], {
      studentId: 'number',
      present: 'boolean',
    });

    if (!validation.isValid) {
      return sendValidationError(reply, validation);
    }

    const { studentId, present } = body;

    // Verificar se a aula está aberta
    const lesson = await db.lesson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!lesson) {
      return reply.code(404).send({
        error: 'Aula não encontrada',
        code: 'LESSON_NOT_FOUND',
      });
    }

    if (!lesson.opened) {
      return reply.code(400).send({
        error: 'Aula não está aberta para marcação de presença',
        code: 'LESSON_NOT_OPEN',
      });
    }

    // Verificar se o estudante existe
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return reply.status(404).send({
        error: 'Estudante não encontrado',
        code: 'STUDENT_NOT_FOUND',
      });
    }

    // Criar ou atualizar presença
    const attendance = await db.lessonStudent.upsert({
      where: {
        lessonId_studentId: {
          lessonId: parseInt(id),
          studentId: studentId,
        },
      },
      update: { present },
      create: {
        lessonId: parseInt(id),
        studentId: studentId,
        present,
      },
      include: {
        student: {
          select: { id: true, name: true, tagId: true },
        },
      },
    });

    reply.send(attendance);
  } catch (error) {
    console.error('Erro ao marcar presença:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

// Listar alunos de uma aula com status de presença
export async function getLessonStudents(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const students = await db.lessonStudent.findMany({
    where: { lessonId: parseInt(id) },
    include: {
      student: {
        select: { id: true, name: true, tagId: true },
      },
    },
  });

  reply.send(students);
}
