import { z } from 'zod';

export const CreateStudentSchema = z.object({
  name: z.string().min(3).max(100),
  tagId: z.string().min(1).max(50),
  startTime: z.string().min(1).max(10).optional(),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const StudentIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => parseInt(v, 10)),
});

export type StudentIdParams = z.infer<typeof StudentIdParamsSchema>;

export const StudentTagParamsSchema = z.object({
  tagId: z.string().min(1).max(50),
});

export type StudentTagParams = z.infer<typeof StudentTagParamsSchema>;
