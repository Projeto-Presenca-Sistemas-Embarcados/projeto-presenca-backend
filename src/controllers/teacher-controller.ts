import type { FastifyReply, FastifyRequest } from 'fastify';
import * as teacherService from '@/services/teacher-service.js';
import {
  CreateTeacherSchema,
  TeacherIdParamsSchema,
} from '@/schemas/teacher-schema.js';

// Listar todos os professores
export async function getTeachers(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const teachers = await teacherService.listTeachers();

  reply.send(teachers);
}

// Criar novo professor
export async function createTeacher(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { name, email, password, tagId, startTime } = CreateTeacherSchema.parse(
    request.body,
  );

  const teacher = await teacherService.createTeacher({
    name,
    email,
    password,
    tagId,
    startTime: startTime ?? null,
  });

  reply.code(201).send(teacher);
}

// Obter professor específico
export async function getTeacher(request: FastifyRequest, reply: FastifyReply) {
  const { id } = TeacherIdParamsSchema.parse(request.params);

  const teacher = await teacherService.getTeacherById(id);

  reply.send(teacher);
}
