import type { FastifyReply, FastifyRequest } from 'fastify';
import * as lessonService from '@/services/lesson-service.js';
import {
  CreateLessonSchema,
  LessonIdParamsSchema,
  LessonsByTeacherParamsSchema,
  MarkAttendanceSchema,
  MarkAttendanceByTagSchema,
  GenerateRecurringLessonsSchema,
  UpdateLessonSchema,
} from '@/schemas/lesson-schema.js';

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
  const { teacherId } = LessonsByTeacherParamsSchema.parse(request.params);
  const lessons = await lessonService.listTeacherLessons(teacherId);

  reply.send(lessons);
}

// Criar nova aula
export async function createLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { room, subject, teacherId, startTime, endTime } =
    CreateLessonSchema.parse(request.body);

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
  const { id } = LessonIdParamsSchema.parse(request.params);
  const lesson = await lessonService.getLessonById(id);

  reply.send(lesson);
}

// Abrir aula (permitir marcação de presença)
export async function openLesson(request: FastifyRequest, reply: FastifyReply) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const lesson = await lessonService.openLesson(id);

  reply.send(lesson);
}

// Fechar aula (finalizar marcação de presença)
export async function closeLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const lesson = await lessonService.closeLesson(id);

  reply.send(lesson);
}

// Marcar presença de um aluno
export async function markAttendance(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const { studentId, present } = MarkAttendanceSchema.parse(request.body);

  const attendance = await lessonService.markAttendance(id, studentId, present);

  reply.send(attendance);
}

// Marcar presença usando a tag do aluno (RFID/NFC)
export async function markAttendanceByTag(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const { tagId } = MarkAttendanceByTagSchema.parse(request.body);

  const attendance = await lessonService.markAttendanceByTag(id, tagId);

  reply.send(attendance);
}

// Listar alunos de uma aula com status de presença
export async function getLessonStudents(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const students = await lessonService.getLessonStudents(id);

  reply.send(students);
}

// Gerar aulas recorrentes por intervalo
export async function generateRecurringLessons(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = GenerateRecurringLessonsSchema.parse(request.body);
  const result = await lessonService.generateRecurringLessons(data);
  reply.code(201).send(result);
}

// Atualizar uma aula
export async function updateLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const data = UpdateLessonSchema.parse(request.body);
  const lesson = await lessonService.updateLesson(id, data);
  reply.send(lesson);
}

// Excluir uma aula
export async function deleteLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const result = await lessonService.deleteLesson(id);
  reply.send(result);
}
