import type { FastifyInstance } from 'fastify';
import * as studentController from '@/controllers/student-controller.js';

export async function studentRoutes(server: FastifyInstance) {
  // Listar todos os alunos
  server.get('/', studentController.getStudents);

  // Criar novo aluno
  server.post('/', studentController.createStudent);

  // Obter aluno específico
  server.get('/:id', studentController.getStudent);

  // Buscar aluno por tagId (para sistema RFID/NFC)
  server.get('/tag/:tagId', studentController.getStudentByTag);
}
