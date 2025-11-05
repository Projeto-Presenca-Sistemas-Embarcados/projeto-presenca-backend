import Fastify from 'fastify';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lessonRoutes } from '../src/routes/lesson-routes.ts';
import { ServiceError } from '../src/errors/service-error.ts';
import { ZodError } from 'zod';
import { formatZodError } from '../src/utils/zod-error.ts';
import * as lessonService from '../src/services/lesson-service.ts';

vi.mock('../src/services/lesson-service.ts', () => {
  return {
    createLesson: vi.fn(async (data: any) => ({ id: 100, ...data })),
    markAttendanceByTag: vi.fn(async (lessonId: number, tagId: string) => ({
      id: 1,
      lessonId,
      studentId: 99,
      present: true,
      student: { id: 99, name: 'Aluno', tagId },
    })),
    getLessonById: vi.fn(async (id: number) => ({ id })),
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
  app.register(lessonRoutes, { prefix: '/lessons' });
  return app;
}

describe('Lesson routes', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(async () => {
    app = buildServer();
    await app.ready();
  });

  it('POST /lessons valida body com Zod e retorna erro padronizado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/lessons',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const json = res.json();
    const fields = json.details.map((d: any) => d.field).sort();
    expect(fields).toEqual(
      ['room', 'subject', 'teacherId', 'startTime', 'endTime'].sort(),
    );
  });

  it('POST /lessons (happy path) retorna 201', async () => {
    const payload = {
      room: 'Sala 1',
      subject: 'Matemática',
      teacherId: 1,
      startTime: '2024-01-01T08:00:00Z',
      endTime: '2024-01-01T10:00:00Z',
    };
    const res = await app.inject({ method: 'POST', url: '/lessons', payload });
    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json).toMatchObject({
      id: expect.any(Number),
      room: 'Sala 1',
      subject: 'Matemática',
    });
  });

  it('POST /lessons/:id/attendance-tag com id inválido retorna 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/lessons/abc/attendance-tag',
      payload: { tagId: 'TAG1' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /lessons/:id/attendance-tag sem tagId retorna 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/lessons/1/attendance-tag',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /lessons/:id não encontrado retorna 404 (ServiceError)', async () => {
    vi.spyOn(lessonService, 'getLessonById').mockImplementationOnce(
      async () => {
        throw new ServiceError(404, 'Aula não encontrada');
      },
    );
    const res = await app.inject({ method: 'GET', url: '/lessons/123' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: 'Aula não encontrada' });
  });

  it('POST /lessons/:id/attendance-tag aluno não encontrado retorna 404 (ServiceError)', async () => {
    vi.spyOn(lessonService, 'markAttendanceByTag').mockImplementationOnce(
      async () => {
        throw new ServiceError(404, 'Aluno não encontrado');
      },
    );
    const res = await app.inject({
      method: 'POST',
      url: '/lessons/1/attendance-tag',
      payload: { tagId: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: 'Aluno não encontrado' });
  });
});
