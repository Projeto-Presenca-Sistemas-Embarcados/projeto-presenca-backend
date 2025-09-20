import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';

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
  const { name, email, password, tagId, startTime } = request.body as {
    name: string;
    email: string;
    password: string;
    tagId: string;
    startTime?: string;
  };

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
