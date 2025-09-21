import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';
import {
  validatePostRequest,
  sendValidationError,
} from '@/utils/validation.js';

// Listar todos os alunos
export async function getStudents(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const students = await db.student.findMany();
  reply.send(students);
}

// Criar novo aluno
export async function createStudent(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = request.body as any;

    // Validação de campos obrigatórios
    const validation = validatePostRequest(
      body,
      ['name', 'tagId'],
      { name: 'string', tagId: 'string', startTime: 'string' },
      {
        name: { min: 2, max: 100 },
        tagId: { min: 1, max: 50 },
        startTime: { min: 1, max: 10 },
      },
    );

    if (!validation.isValid) {
      return sendValidationError(reply, validation);
    }

    const { name, tagId, startTime } = body;

    // Verifica se a tag já está em uso
    const existingStudent = await db.student.findUnique({
      where: { tagId },
    });

    if (existingStudent) {
      return reply.status(409).send({
        error: 'Tag ID já está em uso',
        code: 'TAG_ALREADY_EXISTS',
      });
    }

    const student = await db.student.create({
      data: {
        name,
        tagId,
        startTime: startTime || null,
      },
    });

    reply.code(201).send(student);
  } catch (error) {
    console.error('Erro ao criar estudante:', error);
    return reply.status(500).send({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

// Obter aluno específico
export async function getStudent(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const student = await db.student.findUnique({
    where: { id: parseInt(id) },
  });

  if (!student) {
    return reply.code(404).send({ error: 'Aluno não encontrado' });
  }

  reply.send(student);
}

// Buscar aluno por tagId (para sistema RFID/NFC)
export async function getStudentByTag(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { tagId } = request.params as { tagId: string };

  const student = await db.student.findUnique({
    where: { tagId },
  });

  if (!student) {
    return reply.code(404).send({ error: 'Aluno não encontrado' });
  }

  reply.send(student);
}
