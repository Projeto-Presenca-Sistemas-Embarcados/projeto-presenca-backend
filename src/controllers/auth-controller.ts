import type { FastifyReply, FastifyRequest } from 'fastify';
import * as authService from '@/services/auth-service.js';
import {
  sendValidationError,
  validatePostRequest,
} from '@/utils/validation.js';

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as any;

  const validation = validatePostRequest(
    body,
    ['email', 'password'],
    {
      email: 'string',
      password: 'string',
    },
    {
      email: { min: 5, max: 100 },
      password: { min: 6, max: 100 },
    },
  );

  if (!validation.isValid) {
    return sendValidationError(reply, validation);
  }

  const { email, password } = body as { email: string; password: string };
  const result = await authService.login({ email, password });
  
  return reply.send(result);
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, tagId } = request.body as {
    name: string;
    email: string;
    password: string;
    tagId: string;
  };
  const result = await authService.register({ name, email, password, tagId });
  
  return reply.status(201).send(result);
}
