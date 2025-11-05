import type { FastifyReply, FastifyRequest } from 'fastify';
import * as lessonService from '@/services/lesson-service.js';
import {
  sendValidationError,
  validatePostRequest,
} from '@/utils/validation.js';

// Listar todas as aulas
export async function getLessons(request: FastifyRequest, reply: FastifyReply) {
  const lessons = await lessonService.listLessons();
  reply.send(lessons);
}

// Listar aulas de um professor específico
export async function getTeacherLessons(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { teacherId } = request.params as { teacherId: string };
  const lessons = await lessonService.listTeacherLessons(parseInt(teacherId));
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

  const lesson = await lessonService.createLesson({
    room,
    subject,
    teacherId,
    startTime,
    endTime,
  });
  reply.code(201).send(lesson);
}

// Obter aula específica
export async function getLesson(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const lesson = await lessonService.getLessonById(parseInt(id));
  reply.send(lesson);
}

// Abrir aula (permitir marcação de presença)
export async function openLesson(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const lesson = await lessonService.openLesson(parseInt(id));
  reply.send(lesson);
}

// Fechar aula (finalizar marcação de presença)
export async function closeLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const lesson = await lessonService.closeLesson(parseInt(id));
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

  const attendance = await lessonService.markAttendance(
    parseInt(id),
    studentId,
    present,
  );
  reply.send(attendance);
}

// Marcar presença usando a tag do aluno (RFID/NFC)
export async function markAttendanceByTag(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const body = request.body as any;

  const validation = validatePostRequest(
    body,
    ['tagId'],
    {
      tagId: 'string',
    },
    {
      tagId: { min: 1, max: 50 },
    },
  );

  if (!validation.isValid) {
    return sendValidationError(reply, validation);
  }

  const { tagId } = body as { tagId: string };

  const attendance = await lessonService.markAttendanceByTag(
    parseInt(id),
    tagId,
  );
  reply.send(attendance);
}

// Listar alunos de uma aula com status de presença
export async function getLessonStudents(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const students = await lessonService.getLessonStudents(parseInt(id));
  reply.send(students);
}
