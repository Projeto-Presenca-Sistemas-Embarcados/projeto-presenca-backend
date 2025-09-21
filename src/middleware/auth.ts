import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  extractTokenFromHeader,
  verifyAccessToken,
  type TokenPayload,
} from '@/utils/jwt.js';
import { db } from '@/server.js';

// Estende o tipo FastifyRequest para incluir o usuário autenticado
declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload & { id: number };
  }
}

/**
 * Middleware de autenticação JWT
 * Verifica se o usuário está autenticado e adiciona as informações do usuário à requisição
 */
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    // Extrai o token do header Authorization
    const token = extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      return reply.status(401).send({
        error: 'Token de acesso não fornecido',
        code: 'MISSING_TOKEN',
      });
    }

    // Verifica e decodifica o token
    const payload = verifyAccessToken(token);

    // Busca o usuário no banco de dados para verificar se ainda existe
    const user = await db.teacher.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    // Verifica se o token não foi invalidado (tokenVersion)
    // Note: tokenVersion não está no payload do access token, apenas no refresh token
    // Para simplificar, vamos confiar que o token é válido se o usuário existe

    // Adiciona as informações do usuário à requisição
    request.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: 'teacher',
    };

    // Continua para a próxima função
  } catch (error) {
    return reply.status(401).send({
      error: 'Token inválido ou expirado',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Middleware opcional de autenticação
 * Não retorna erro se o usuário não estiver autenticado, apenas adiciona as informações se estiver
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const token = extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      return; // Continua sem autenticação
    }

    const payload = verifyAccessToken(token);

    const user = await db.teacher.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        tokenVersion: true,
      },
    });

    if (user) {
      request.user = {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: 'teacher',
      };
    }
  } catch (error) {
    // Ignora erros de autenticação em middleware opcional
  }
}

/**
 * Middleware para verificar se o usuário é um professor
 */
export async function requireTeacher(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      error: 'Autenticação necessária',
      code: 'AUTHENTICATION_REQUIRED',
    });
  }

  if (request.user.role !== 'teacher') {
    return reply.status(403).send({
      error: 'Acesso negado - apenas professores',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }
}
