import type { FastifyInstance } from 'fastify';
import * as lessonController from '@/controllers/lesson-controller.js';

export async function lessonRoutes(server: FastifyInstance) {
  // Listar todas as aulas
  server.get('/', lessonController.getLessons);

  // Criar nova aula
  server.post('/', lessonController.createLesson);

  // Obter aula específica
  server.get('/:id', lessonController.getLesson);

  // Listar aulas de um professor
  server.get('/teacher/:teacherId', lessonController.getTeacherLessons);

  // Abrir aula (permitir marcação de presença)
  server.post('/:id/open', lessonController.openLesson);

  // Fechar aula (finalizar marcação de presença)
  server.post('/:id/close', lessonController.closeLesson);

  // Listar alunos de uma aula
  server.get('/:id/students', lessonController.getLessonStudents);

  // Marcar presença de um aluno
  server.post('/:id/attendance', lessonController.markAttendance);

  // Marcar presença usando a tag do aluno (RFID/NFC) - útil para ESP32
  server.post('/:id/attendance-tag', lessonController.markAttendanceByTag);

  // Gerar aulas recorrentes em um intervalo de datas
  server.post('/recurring/generate', lessonController.generateRecurringLessons);

  // Atualizar aula
  server.put('/:id', lessonController.updateLesson);

  // Excluir aula
  server.delete('/:id', lessonController.deleteLesson);

  // Gerenciar alunos de uma aula
  server.post('/:id/students', lessonController.addStudentToLesson);
  server.delete(
    '/:id/students/:studentId',
    lessonController.removeStudentFromLesson,
  );
}
