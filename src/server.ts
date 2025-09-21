import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { lessonRoutes } from '@/routes/lesson-routes.js';
import { teacherRoutes } from '@/routes/teacher-routes.js';
import { studentRoutes } from '@/routes/student-routes.js';
import { authRoutes } from './routes/auth-routes.js';

export const db = new PrismaClient();
const server = fastify({ logger: true });

await server.register(cors, { origin: '*' });

// Rotas da API
await server.register(lessonRoutes, { prefix: '/lessons' });
await server.register(teacherRoutes, { prefix: '/teachers' });
await server.register(studentRoutes, { prefix: '/students' });
await server.register(authRoutes, { prefix: '/auth' });

server.get('/', async (request, reply) => {
  reply.code(200).send({ hello: 'world' });
});

server.listen({ port: 3000 }, (err) => {
  if (err) {
    server.log.error(`Error starting server: ${err}`);
    process.exit(1);
  }
});
