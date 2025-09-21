import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '@/server.js';

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as {
    email: string;
    password: string;
  };

  const teacher = await db.teacher.findUnique({
    where: { email },
  });

  if (!teacher || teacher.password !== password) {
    return reply
      .status(401)
      .send({ error: 'Invalid email or password', isAuthenticated: false });
  }

  // Se o login for bem-sucedido, você pode retornar um token JWT ou outra informação relevante.
  return reply.send({ message: 'Login successful', isAuthenticated: true });
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, tagId } = request.body as {
    name: string;
    email: string;
    password: string;
    tagId: string;
  };

  const existingTeacher = await db.teacher.findUnique({
    where: { email },
  });

  if (existingTeacher) {
    return reply.status(409).send({ error: 'Email already registered' });
  }

  const existingTag = await db.teacher.findUnique({
    where: { tagId },
  });

  if (existingTag) {
    return reply.status(409).send({ error: 'Tag ID already registered' });
  }

  // Se não houver um professor existente, crie um novo
  const newTeacher = await db.teacher.create({
    data: { name, email, password, tagId },
  });

  return reply
    .status(201)
    .send({ message: 'Registration successful', teacher: newTeacher });
}
