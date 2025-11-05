import { z } from 'zod';

export const CreateLessonSchema = z.object({
  room: z.string().min(1).max(50),
  subject: z.string().min(3).max(100),
  teacherId: z.coerce.number().int().positive(),
  startTime: z.string().min(1).max(30),
  endTime: z.string().min(1).max(30),
});

export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;

export const LessonIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => parseInt(v, 10)),
});

export type LessonIdParams = z.infer<typeof LessonIdParamsSchema>;

export const LessonsByTeacherParamsSchema = z.object({
  teacherId: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => parseInt(v, 10)),
});

export type LessonsByTeacherParams = z.infer<
  typeof LessonsByTeacherParamsSchema
>;

export const MarkAttendanceSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  present: z.boolean(),
});

export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;

export const MarkAttendanceByTagSchema = z.object({
  tagId: z.string().min(1).max(50),
});

export type MarkAttendanceByTagInput = z.infer<
  typeof MarkAttendanceByTagSchema
>;
