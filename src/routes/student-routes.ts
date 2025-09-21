import type { FastifyInstance } from 'fastify';
import * as studentController from '@/controllers/student-controller.js';
import { authenticateToken, requireTeacher } from '@/middleware/auth.js';

export async function studentRoutes(server: FastifyInstance) {
  // Rotas protegidas - requerem autenticação de professor
  server.get(
    '/',
    { preHandler: [authenticateToken, requireTeacher] },
    studentController.getStudents,
  );
  server.post(
    '/',
    { preHandler: [authenticateToken, requireTeacher] },
    studentController.createStudent,
  );
  server.get(
    '/:id',
    { preHandler: [authenticateToken, requireTeacher] },
    studentController.getStudent,
  );

  // Rota pública para busca por tag (usado pelo sistema RFID/NFC)
  server.get('/tag/:tagId', studentController.getStudentByTag);
}
