import Fastify from 'fastify';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authRoutes } from '../src/routes/auth-routes.ts';
import { ServiceError } from '../src/errors/service-error.ts';
import { ZodError } from 'zod';
import { formatZodError } from '../src/utils/zod-error.ts';

vi.mock('../src/services/auth-service.ts', () => {
  return {
    login: vi.fn(async () => ({
      message: 'Login successful',
      isAuthenticated: true,
    })),
    register: vi.fn(async (data: any) => ({
      message: 'Registration successful',
      teacher: { id: 1, ...data },
    })),
  };
});

function buildServer() {
  const app = Fastify({ logger: false });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send(formatZodError(error));
    }
    if (error instanceof ServiceError) {
      // @ts-ignore custom property in our ServiceError
      return reply.code(error.status).send({ error: error.message });
    }
    return reply.code(500).send({ error: 'Internal Server Error' });
  });
  app.register(authRoutes, { prefix: '/auth' });
  return app;
}

describe('Auth routes', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(async () => {
    app = buildServer();
    await app.ready();
  });

  it('POST /auth/login inválido retorna 400 e erro padronizado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const json = res.json();
    const fields = json.details.map((d: any) => d.field).sort();
    expect(fields).toEqual(['email', 'password'].sort());
  });

  it('POST /auth/login (happy path) retorna 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@a.com', password: 'secret' },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json).toMatchObject({ isAuthenticated: true });
  });

  it('POST /auth/register inválido retorna 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const json = res.json();
    const fields = json.details.map((d: any) => d.field).sort();
    expect(fields).toEqual(['email', 'name', 'password', 'tagId'].sort());
  });

  it('POST /auth/register (happy path) retorna 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Prof',
        email: 'p@p.com',
        password: 'secret',
        tagId: 'TAG10',
      },
    });
    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json).toMatchObject({
      message: 'Registration successful',
      teacher: { id: 1 },
    });
  });
});
