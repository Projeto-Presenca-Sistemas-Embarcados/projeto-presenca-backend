import { z } from 'zod';

export const CreateTeacherSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email().min(5).max(100),
  password: z.string().min(6).max(100),
  tagId: z.string().min(1).max(50),
  startTime: z.string().min(1).max(10).optional(),
});

export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;

export const TeacherIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => parseInt(v, 10)),
});

export type TeacherIdParams = z.infer<typeof TeacherIdParamsSchema>;
