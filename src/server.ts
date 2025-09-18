import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

// TODO: Fazer os endpoints e lidar com o crud do sistema

const db = new PrismaClient();
const server = fastify({ logger: true });

await server.register(cors, { origin: '*' });

server.get('/', async (request, reply) => {
  reply.code(200).send({ hello: 'world' });
});

server.listen({ port: 3000 }, (err) => {
  if (err) {
    server.log.error(`Error starting server: ${err}`);
    process.exit(1);
  }
});
