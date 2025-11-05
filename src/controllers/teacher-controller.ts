import type { FastifyReply, FastifyRequest } from 'fastify';
import * as teacherService from '@/services/teacher-service.js';
import {
  sendValidationError,
  validatePostRequest,
} from '@/utils/validation.js';

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
  const body = request.body as any;

  const validation = validatePostRequest(
    body,
    ['name', 'email', 'password', 'tagId'],
    {
      name: 'string',
      email: 'string',
      password: 'string',
      tagId: 'string',
      startTime: 'string',
    },
    {
      name: { min: 3, max: 100 },
      email: { min: 5, max: 100 },
      password: { min: 6, max: 100 },
      tagId: { min: 1, max: 50 },
      startTime: { min: 1, max: 10 },
    },
  );

  if (!validation.isValid) {
    return sendValidationError(reply, validation);
  }

  const { name, email, password, tagId, startTime } = body as {
    name: string;
    email: string;
    password: string;
    tagId: string;
    startTime?: string;
  };
  
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
  const { id } = request.params as { id: string };

  const teacher = await teacherService.getTeacherById(parseInt(id));
  
  reply.send(teacher);
}
