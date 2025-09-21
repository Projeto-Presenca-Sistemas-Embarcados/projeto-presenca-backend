import type { FastifyInstance } from 'fastify';
import * as authController from '@/controllers/auth-controller.js';

export async function authRoutes(server: FastifyInstance) {
  // Rota de login
  server.post('/login', authController.login);

  // Rota de registro
  server.post('/register', authController.register);
}
