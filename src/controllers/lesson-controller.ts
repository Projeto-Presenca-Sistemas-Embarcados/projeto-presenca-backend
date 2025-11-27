import type { FastifyReply, FastifyRequest } from 'fastify';
import * as lessonService from '@/services/lesson-service.js';
import { getAttendanceLogs, clearAttendanceLogs } from '@/services/mqtt-service.js';
import {
  CreateLessonSchema,
  LessonIdParamsSchema,
  LessonsByTeacherParamsSchema,
  MarkAttendanceSchema,
  MarkAttendanceByTagSchema,
  GenerateRecurringLessonsSchema,
  UpdateLessonSchema,
  AddStudentToLessonSchema,
  LessonStudentParamsSchema,
  CreateLessonWithStudentsSchema,
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
  const data = CreateLessonWithStudentsSchema.parse(request.body);

  const lesson = await lessonService.createLesson({
    room: data.room,
    subject: data.subject,
    teacherId: data.teacherId,
    startTime: data.startTime,
    endTime: data.endTime,
    students: data.students ?? [],
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

// Adicionar aluno a uma aula
export async function addStudentToLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const { studentId } = AddStudentToLessonSchema.parse(request.body);
  const attendance = await lessonService.addStudentToLesson(id, studentId);
  reply.code(201).send(attendance);
}

// Remover aluno de uma aula
export async function removeStudentFromLesson(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id, studentId } = LessonStudentParamsSchema.parse(request.params);
  const result = await lessonService.removeStudentFromLesson(id, studentId);
  reply.send(result);
}

// Obter logs de presença de uma aula
export async function getLessonLogs(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  const logs = getAttendanceLogs(id);
  // Converter Date para ISO string para serialização JSON
  reply.send(
    logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    })),
  );
}

// Limpar logs de presença de uma aula
export async function clearLessonLogs(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = LessonIdParamsSchema.parse(request.params);
  clearAttendanceLogs(id);
  reply.send({ message: 'Logs de presença limpos com sucesso' });
}
