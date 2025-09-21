import type { FastifyInstance } from 'fastify';
import * as lessonController from '@/controllers/lesson-controller.js';
import { authenticateToken, requireTeacher } from '@/middleware/auth.js';

export async function lessonRoutes(server: FastifyInstance) {
  // Rotas protegidas - requerem autenticação de professor
  server.get(
    '/',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.getLessons,
  );
  server.post(
    '/',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.createLesson,
  );
  server.get(
    '/:id',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.getLesson,
  );
  server.get(
    '/teacher/:teacherId',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.getTeacherLessons,
  );
  server.post(
    '/:id/open',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.openLesson,
  );
  server.post(
    '/:id/close',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.closeLesson,
  );
  server.get(
    '/:id/students',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.getLessonStudents,
  );
  server.post(
    '/:id/attendance',
    { preHandler: [authenticateToken, requireTeacher] },
    lessonController.markAttendance,
  );
}
