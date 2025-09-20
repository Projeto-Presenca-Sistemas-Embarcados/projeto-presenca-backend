import type { FastifyInstance } from 'fastify';
import * as lessonController from '@/controllers/lesson-controller.js';

export async function lessonRoutes(server: FastifyInstance) {
  server.get('/', lessonController.getLessons);
}
