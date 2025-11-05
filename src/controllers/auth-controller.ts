import type { FastifyReply, FastifyRequest } from 'fastify';
import * as authService from '@/services/auth-service.js';
import { LoginSchema, RegisterSchema } from '@/schemas/auth-schema.js';

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = LoginSchema.parse(request.body);
  const result = await authService.login({ email, password });

  return reply.send(result);
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, tagId } = RegisterSchema.parse(request.body);
  const result = await authService.register({ name, email, password, tagId });

  return reply.status(201).send(result);
}
