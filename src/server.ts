import fastify from 'fastify';
import { PrismaClient } from '@prisma/client';

const server = fastify({ logger: true });
const database = new PrismaClient();

server.get('/', async (request, reply) => {
  reply.code(200).send({ hello: 'world' });
});

server.listen({ port: 3000 }, (err) => {
  if (err) {
    server.log.error(`Error starting server: ${err}`);
  }
});
