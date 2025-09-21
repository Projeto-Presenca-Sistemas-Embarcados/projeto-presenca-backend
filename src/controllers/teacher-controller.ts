import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';
import {
  sendValidationError,
  validatePostRequest,
} from '@/utils/validation.js';

// Listar todos os professores
export async function getTeachers(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const teachers = await db.teacher.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tagId: true,
      startTime: true,
      // Não incluir password por segurança
    },
  });
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

  const { name, email, password, tagId, startTime } = body;

  const existingEmail = await db.teacher.findUnique({
    where: { email },
  });

  const existingTag = await db.teacher.findUnique({
    where: { tagId },
  });

  if (existingEmail) {
    return reply.status(409).send({
      error: 'Email já está em uso',
      code: 'EMAIL_ALREADY_EXISTS',
    });
  }
  if (existingTag) {
    return reply.status(409).send({
      error: 'Tag ID já está em uso',
      code: 'TAGID_ALREADY_EXISTS',
    });
  }

  const teacher = await db.teacher.create({
    data: {
      name,
      email,
      password, // Em produção, hash da senha
      tagId,
      startTime: startTime || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      tagId: true,
      startTime: true,
    },
  });

  reply.code(201).send(teacher);
}

// Obter professor específico
export async function getTeacher(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const teacher = await db.teacher.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      email: true,
      tagId: true,
      startTime: true,
    },
  });

  if (!teacher) {
    return reply.code(404).send({ error: 'Professor não encontrado' });
  }

  reply.send(teacher);
}
