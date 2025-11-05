import { db } from '@/db.js';
import { ServiceError } from '@/errors/service-error.js';

export async function login(input: { email: string; password: string }) {
  const { email, password } = input;
  const teacher = await db.teacher.findUnique({ where: { email } });
  if (!teacher || teacher.password !== password) {
    throw new ServiceError(401, 'Invalid email or password');
  }
  return {
    message: 'Login successful',
    isAuthenticated: true,
    email: teacher.email,
  };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  tagId: string;
}) {
  const { name, email, password, tagId } = input;

  const existingTeacher = await db.teacher.findUnique({ where: { email } });
  if (existingTeacher) {
    throw new ServiceError(409, 'Email already registered');
  }

  const existingTag = await db.teacher.findUnique({ where: { tagId } });
  if (existingTag) {
    throw new ServiceError(409, 'Tag ID already registered');
  }

  const newTeacher = await db.teacher.create({
    data: { name, email, password, tagId },
  });

  return { message: 'Registration successful', teacher: newTeacher };
}
