import type { FastifyInstance } from 'fastify';
import * as authController from '@/controllers/auth-controller.js';
import { authenticateToken } from '@/middleware/auth.js';

export async function authRoutes(server: FastifyInstance) {
  // Rotas públicas (não requerem autenticação)
  server.post('/login', authController.login);
  server.post('/register', authController.register);
  server.post('/refresh', authController.refreshToken);

  // Rotas protegidas (requerem autenticação)
  server.post(
    '/logout',
    { preHandler: authenticateToken },
    authController.logout,
  );
  server.post(
    '/change-password',
    { preHandler: authenticateToken },
    authController.changePassword,
  );
}
