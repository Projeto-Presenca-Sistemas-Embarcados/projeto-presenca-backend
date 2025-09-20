import type { FastifyInstance } from 'fastify';
import * as teacherController from '@/controllers/teacher-controller.js';

export async function teacherRoutes(server: FastifyInstance) {
  // Listar todos os professores
  server.get('/', teacherController.getTeachers);

  // Criar novo professor
  server.post('/', teacherController.createTeacher);

  // Obter professor específico
  server.get('/:id', teacherController.getTeacher);
}
