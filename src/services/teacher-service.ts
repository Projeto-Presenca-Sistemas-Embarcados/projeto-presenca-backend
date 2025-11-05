import { db } from '@/server.js';
import { ServiceError } from '@/errors/service-error.js';

export async function listTeachers() {
  return db.teacher.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tagId: true,
      startTime: true,
    },
  });
}

export async function createTeacher(input: {
  name: string;
  email: string;
  password: string;
  tagId: string;
  startTime?: string | null;
}) {
  const { name, email, password, tagId, startTime } = input;

  const existingEmail = await db.teacher.findUnique({ where: { email } });
  if (existingEmail) {
    throw new ServiceError(409, 'Email já está em uso');
  }

  const existingTag = await db.teacher.findUnique({ where: { tagId } });
  if (existingTag) {
    throw new ServiceError(409, 'Tag ID já está em uso');
  }

  return db.teacher.create({
    data: {
      name,
      email,
      password, // TODO: hash em produção
      tagId,
      startTime: startTime || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      tagId: true,
      startTime: true,
    },
  });
}

export async function getTeacherById(id: number) {
  const teacher = await db.teacher.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      tagId: true,
      startTime: true,
    },
  });
  if (!teacher) throw new ServiceError(404, 'Professor não encontrado');
  return teacher;
}
