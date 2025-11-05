import type { FastifyReply, FastifyRequest } from 'fastify';
import * as studentService from '@/services/student-service.js';
import {
  sendValidationError,
  validatePostRequest,
} from '@/utils/validation.js';

// Listar todos os alunos
export async function getStudents(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const students = await studentService.listStudents();
  reply.send(students);
}

// Criar novo aluno
export async function createStudent(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as any;

  const validation = validatePostRequest(
    body,
    ['name', 'tagId'],
    {
      name: 'string',
      tagId: 'string',
      startTime: 'string',
    },
    {
      name: { min: 3, max: 100 },
      tagId: { min: 1, max: 50 },
      startTime: { min: 1, max: 10 },
    },
  );

  if (!validation.isValid) {
    return sendValidationError(reply, validation);
  }

  const { name, tagId, startTime } = body as {
    name: string;
    tagId: string;
    startTime?: string;
  };
  
  const student = await studentService.createStudent({
    name,
    tagId,
    startTime: startTime ?? null,
  });
  
  reply.code(201).send(student);
}

// Obter aluno específico
export async function getStudent(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const student = await studentService.getStudentById(parseInt(id));
  
  reply.send(student);
}

// Buscar aluno por tagId (para sistema RFID/NFC)
export async function getStudentByTag(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { tagId } = request.params as { tagId: string };

  const student = await studentService.getStudentByTag(tagId);
  
  reply.send(student);
}
