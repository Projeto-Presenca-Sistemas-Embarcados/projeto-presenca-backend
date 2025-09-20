import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';

export async function getLessons(request: FastifyRequest, reply: FastifyReply) {
  const lessons = await db.lesson.findMany();
  reply.send(lessons);
}
