import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { lessonRoutes } from '@/routes/lesson-routes.js';
import { teacherRoutes } from '@/routes/teacher-routes.js';
import { studentRoutes } from '@/routes/student-routes.js';
import { authRoutes } from '@/routes/auth-routes.js';
import { ServiceError } from '@/errors/service-error.js';
import { ZodError } from 'zod';
import { formatZodError } from '@/utils/zod-error.js';
import { initializeMqttClient } from '@/services/mqtt-service.js';

const server = fastify({ logger: true });

await server.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

server.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send(formatZodError(error));
  }
  if (error instanceof ServiceError) {
    return reply.code(error.status).send({ error: error.message });
  }

  server.log.error({ err: error }, 'Unhandled error');
  return reply.code(500).send({ error: 'Internal Server Error' });
});

// Rotas da API
await server.register(lessonRoutes, { prefix: '/lessons' });
await server.register(teacherRoutes, { prefix: '/teachers' });
await server.register(studentRoutes, { prefix: '/students' });
await server.register(authRoutes, { prefix: '/auth' });

server.get('/', async (request, reply) => {
  reply.code(200).send({ hello: 'world' });
});

// Inicializar cliente MQTT
initializeMqttClient().catch((error) => {
  server.log.error(`Erro ao inicializar cliente MQTT: ${error}`);
});

server.listen({ port: 3001 }, (err) => {
  if (err) {
    server.log.error(`Erro ao iniciar servidor: ${err}`);
    process.exit(1);
  }
});
