import type { FastifyInstance } from 'fastify';
import * as teacherController from '@/controllers/teacher-controller.js';
import { authenticateToken, requireTeacher } from '@/middleware/auth.js';

export async function teacherRoutes(server: FastifyInstance) {
  // Rotas protegidas - requerem autenticação de professor
  server.get(
    '/',
    { preHandler: [authenticateToken, requireTeacher] },
    teacherController.getTeachers,
  );
  server.post(
    '/',
    { preHandler: [authenticateToken, requireTeacher] },
    teacherController.createTeacher,
  );
  server.get(
    '/:id',
    { preHandler: [authenticateToken, requireTeacher] },
    teacherController.getTeacher,
  );
}
