import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email().min(5).max(100),
  password: z.string().min(6).max(100),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email().min(5).max(100),
  password: z.string().min(6).max(100),
  tagId: z.string().min(1).max(50),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
