import Fastify from 'fastify';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherRoutes } from '../src/routes/teacher-routes.ts';
import { ServiceError } from '../src/errors/service-error.ts';
import { ZodError } from 'zod';
import { formatZodError } from '../src/utils/zod-error.ts';
import * as teacherService from '../src/services/teacher-service.ts';

vi.mock('../src/services/teacher-service.ts', () => {
  return {
    listTeachers: vi.fn(async () => [
      {
        id: 1,
        name: 'Prof A',
        email: 'a@example.com',
        tagId: 'T1',
        startTime: '08:00',
      },
    ]),
    createTeacher: vi.fn(async (data: any) => ({ id: 10, ...data })),
    getTeacherById: vi.fn(async (id: number) => ({
      id,
      name: 'Prof A',
      email: 'a@example.com',
      tagId: 'T1',
      startTime: '08:00',
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
  app.register(teacherRoutes, { prefix: '/teachers' });
  return app;
}

describe('Teacher routes', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(async () => {
    app = buildServer();
    await app.ready();
  });

  it('POST /teachers deve validar body e retornar erro padronizado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/teachers',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const json = res.json();
    const fields = json.details.map((d: any) => d.field).sort();
    expect(fields).toEqual(['email', 'name', 'password', 'tagId'].sort());
  });

  it('POST /teachers (happy path) retorna 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/teachers',
      payload: {
        name: 'Prof',
        email: 'prof@example.com',
        password: 'secret123',
        tagId: 'TAG10',
      },
    });
    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json).toMatchObject({
      id: expect.any(Number),
      name: 'Prof',
      email: 'prof@example.com',
    });
  });

  it('GET /teachers/:id inválido deve retornar 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/teachers/abc' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /teachers com email duplicado retorna 409 (ServiceError)', async () => {
    vi.spyOn(teacherService, 'createTeacher').mockImplementationOnce(
      async () => {
        throw new ServiceError(409, 'Email já está em uso');
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/teachers',
      payload: {
        name: 'Prof',
        email: 'prof@example.com',
        password: 'secret123',
        tagId: 'TAG10',
      },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'Email já está em uso' });
  });

  it('GET /teachers/:id não encontrado retorna 404 (ServiceError)', async () => {
    vi.spyOn(teacherService, 'getTeacherById').mockImplementationOnce(
      async () => {
        throw new ServiceError(404, 'Professor não encontrado');
      },
    );
    const res = await app.inject({ method: 'GET', url: '/teachers/999' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: 'Professor não encontrado' });
  });
});
