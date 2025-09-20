import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { lessonRoutes } from '@/routes/lesson-routes.js';

export const db = new PrismaClient();
const server = fastify({ logger: true });

await server.register(cors, { origin: '*' });

await server.register(lessonRoutes, { prefix: '/lessons' });

server.get('/', async (request, reply) => {
  reply.code(200).send({ hello: 'world' });
});

server.listen({ port: 3000 }, (err) => {
  if (err) {
    server.log.error(`Error starting server: ${err}`);
    process.exit(1);
  }
});
