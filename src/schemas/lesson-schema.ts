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

// Geração de aulas recorrentes por intervalo
export const GenerateRecurringLessonsSchema = z.object({
  room: z.string().min(1).max(50),
  subject: z.string().min(3).max(100),
  teacherId: z.coerce.number().int().positive(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  startHour: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  endHour: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  weekdays: z.array(z.number().int().min(0).max(6)).nonempty(), // 0=Domingo ... 6=Sábado
});

export type GenerateRecurringLessonsInput = z.infer<
  typeof GenerateRecurringLessonsSchema
>;

// Atualizar aula (campos opcionais, pelo menos um)
export const UpdateLessonSchema = z
  .object({
    room: z.string().min(1).max(50).optional(),
    subject: z.string().min(3).max(100).optional(),
    startTime: z.string().min(1).max(30).optional(),
    endTime: z.string().min(1).max(30).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser informado',
    path: ['root'],
  });

export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;
