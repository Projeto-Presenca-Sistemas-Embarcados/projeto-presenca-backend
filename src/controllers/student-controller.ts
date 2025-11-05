import type { FastifyReply, FastifyRequest } from 'fastify';
import * as studentService from '@/services/student-service.js';
import {
  CreateStudentSchema,
  StudentIdParamsSchema,
  StudentTagParamsSchema,
} from '@/schemas/student-schema.js';

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
  const { name, tagId, startTime } = CreateStudentSchema.parse(request.body);

  const student = await studentService.createStudent({
    name,
    tagId,
    startTime: startTime ?? null,
  });

  reply.code(201).send(student);
}

// Obter aluno específico
export async function getStudent(request: FastifyRequest, reply: FastifyReply) {
  const { id } = StudentIdParamsSchema.parse(request.params);

  const student = await studentService.getStudentById(id);

  reply.send(student);
}

// Buscar aluno por tagId (para sistema RFID/NFC)
export async function getStudentByTag(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { tagId } = StudentTagParamsSchema.parse(request.params);

  const student = await studentService.getStudentByTag(tagId);

  reply.send(student);
}
