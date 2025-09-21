import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';
import {
  sendValidationError,
  validatePostRequest,
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
  const body = request.body as any;

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
      subject: { min: 3, max: 100 },
      teacherId: { min: 1 },
      startTime: { min: 1, max: 10 },
      endTime: { min: 1, max: 10 },
    },
  );

  if (!validation.isValid) {
    return sendValidationError(reply, validation);
  }

  const { room, subject, teacherId, startTime, endTime } = body as {
    room: string;
    subject: string;
    teacherId: number;
    startTime: string;
    endTime: string;
  };

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
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  reply.code(201).send(lesson);
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
  const { id } = request.params as { id: string };

  const body = request.body as any;

  const validation = validatePostRequest(
    body,
    ['studentId', 'present'],
    {
      studentId: 'number',
      present: 'boolean',
    },
    {
      studentId: { min: 1 },
    },
  );

  if (!validation.isValid) {
    return sendValidationError(reply, validation);
  }

  const { studentId, present } = body as {
    studentId: number;
    present: boolean;
  };

  // Verificar se a aula está aberta
  const lesson = await db.lesson.findUnique({
    where: { id: parseInt(id) },
  });

  if (!lesson) {
    return reply.code(404).send({ error: 'Aula não encontrada' });
  }

  if (!lesson.opened) {
    return reply
      .code(400)
      .send({ error: 'Aula não está aberta para marcação de presença' });
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
