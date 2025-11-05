import { db } from '@/server.js';
import { ServiceError } from '@/errors/service-error.js';

export async function listStudents() {
  return db.student.findMany();
}

export async function createStudent(input: {
  name: string;
  tagId: string;
  startTime?: string | null;
}) {
  const { name, tagId, startTime } = input;

  const existing = await db.student.findUnique({ where: { tagId } });
  if (existing) {
    throw new ServiceError(409, 'Tag ID já cadastrado');
  }

  return db.student.create({
    data: {
      name,
      tagId,
      startTime: startTime || null,
    },
  });
}

export async function getStudentById(id: number) {
  const student = await db.student.findUnique({ where: { id } });
  if (!student) throw new ServiceError(404, 'Aluno não encontrado');
  
  return student;
}

export async function getStudentByTag(tagId: string) {
  const student = await db.student.findUnique({ where: { tagId } });
  if (!student) throw new ServiceError(404, 'Aluno não encontrado');
  
  return student;
}
