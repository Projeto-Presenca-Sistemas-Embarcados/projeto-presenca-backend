import Fastify from 'fastify';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentRoutes } from '../src/routes/student-routes.ts';
import { ServiceError } from '../src/errors/service-error.ts';
import { ZodError } from 'zod';
import { formatZodError } from '../src/utils/zod-error.ts';
import * as studentService from '../src/services/student-service.ts';

// Mock do service chamado pelo controller
vi.mock('../src/services/student-service.ts', () => {
  return {
    listStudents: vi.fn(async () => [{ id: 1, name: 'A', tagId: 'T1' }]),
    createStudent: vi.fn(async (data: any) => ({ id: 123, ...data })),
    getStudentById: vi.fn(async (id: number) => ({
      id,
      name: 'A',
      tagId: 'T1',
    })),
    getStudentByTag: vi.fn(async (tagId: string) => ({
      id: 1,
      name: 'A',
      tagId,
    })),
  };
});

function buildServer() {
  const app = Fastify({ logger: false });
  // Error handler igual ao server.ts (Zod + ServiceError)
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send(formatZodError(error));
    }
    if (error instanceof ServiceError) {
      return reply.code(error.status).send({ error: error.message });
    }
    return reply.code(500).send({ error: 'Internal Server Error' });
  });
  // Registrar rotas
  app.register(studentRoutes, { prefix: '/students' });
  return app;
}

describe('Student routes', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(async () => {
    app = buildServer();
    await app.ready();
  });

  it('POST /students deve validar body com Zod e retornar erro padronizado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/students',
      payload: {}, // faltando campos
    });

    expect(res.statusCode).toBe(400);
    const json = res.json();
    expect(json).toMatchObject({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: expect.any(Array),
    });

    const fields = json.details.map((d: any) => d.field).sort();
    expect(fields).toEqual(['name', 'tagId'].sort());
  });

  it('POST /students (happy path) deve criar aluno e retornar 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/students',
      payload: { name: 'João', tagId: 'TAG1', startTime: '08:00' },
    });

    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json).toMatchObject({
      id: expect.any(Number),
      name: 'João',
      tagId: 'TAG1',
    });
  });

  it('GET /students/:id com id inválido deve falhar com 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/students/abc' });
    expect(res.statusCode).toBe(400);
    const json = res.json();
    expect(json.error).toBe('Dados inválidos');
  });

  it('POST /students com tag duplicada deve retornar 409 (ServiceError)', async () => {
    // Próxima chamada do service vai lançar conflito
    vi.spyOn(studentService, 'createStudent').mockImplementationOnce(
      async () => {
        throw new ServiceError(409, 'Tag ID já cadastrado');
      },
    );

    const res = await app.inject({
      method: 'POST',
      url: '/students',
      payload: { name: 'João', tagId: 'TAG1' },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'Tag ID já cadastrado' });
  });

  it('GET /students/:id não encontrado deve retornar 404 (ServiceError)', async () => {
    vi.spyOn(studentService, 'getStudentById').mockImplementationOnce(
      async () => {
        throw new ServiceError(404, 'Aluno não encontrado');
      },
    );

    const res = await app.inject({ method: 'GET', url: '/students/999' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: 'Aluno não encontrado' });
  });
});
