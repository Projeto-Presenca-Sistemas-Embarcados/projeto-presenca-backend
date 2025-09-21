import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';
import {
  validatePostRequest,
  sendValidationError,
} from '@/utils/validation.js';
import { hashPassword, validatePasswordStrength } from '@/utils/password.js';

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
  try {
    const body = request.body as any;

    // Validação de campos obrigatórios
    const validation = validatePostRequest(
      body,
      ['name', 'email', 'password', 'tagId'],
      {
        name: 'string',
        email: 'email',
        password: 'string',
        tagId: 'string',
        startTime: 'string',
      },
      {
        name: { min: 2, max: 100 },
        email: { min: 5, max: 255 },
        password: { min: 8, max: 255 },
        tagId: { min: 1, max: 50 },
        startTime: { min: 1, max: 10 },
      },
    );

    if (!validation.isValid) {
      return sendValidationError(reply, validation);
    }

    const { name, email, password, tagId, startTime } = body;

    // Valida força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return reply.status(400).send({
        error: 'Senha não atende aos critérios de segurança',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors,
      });
    }

    // Verifica se o email já está em uso
    const existingTeacher = await db.teacher.findUnique({
      where: { email },
    });

    if (existingTeacher) {
      return reply.status(409).send({
        error: 'Email já está em uso',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Verifica se a tag já está em uso
    const existingTag = await db.teacher.findUnique({
      where: { tagId },
    });

    if (existingTag) {
      return reply.status(409).send({
        error: 'Tag ID já está em uso',
        code: 'TAG_ALREADY_EXISTS',
      });
    }

    // Gera hash da senha
    const hashedPassword = await hashPassword(password);

    const teacher = await db.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tagId,
        startTime: startTime || null,
        tokenVersion: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        tagId: true,
        startTime: true,
        createdAt: true,
      },
    });

    reply.code(201).send(teacher);
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
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
