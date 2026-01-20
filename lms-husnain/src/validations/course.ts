import { z } from "zod";

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const scheduleSchema = z
  .object({
    dayOfWeek: z
      .number()
      .min(1)
      .max(7) // ✅ CHANGED: Allow 1 (Monday) to 7 (Sunday)
      .int("Day must be between 1 (Monday) and 7 (Sunday)"),
    startTime: z
      .string()
      .regex(timeRegex, "Start time must be in HH:MM format"),
    endTime: z.string().regex(timeRegex, "End time must be in HH:MM format"),
  })
  .refine(
    (data) => {
      const start = data.startTime.split(":").map(Number);
      const end = data.endTime.split(":").map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return endMinutes > startMinutes;
    },
    { message: "End time must be after start time", path: ["endTime"] }
  );

export const createCourseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Course name is required")
    .max(255, "Course name too long"),
  description: z.string().trim().optional(),

  categories: z
    .array(z.string().trim().min(1))
    .min(1, "At least one category is required"),
  courseCurriculum: z.string().trim().optional(),
  totalSessions: z
    .number()
    .int()
    .min(1, "Total sessions must be at least 1")
    .max(100, "Total sessions cannot exceed 100"),
  schedules: z
    .array(scheduleSchema)
    .min(1, "At least one schedule is required"),
});

export const updateCourseSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional(),
  categories: z.array(z.string().trim().min(1)).min(1).optional(),
  courseCurriculum: z.string().trim().optional(),
  totalSessions: z.number().int().min(1).max(100).optional(),
  schedules: z.array(scheduleSchema).min(1).optional(),
});

export const courseFilterSchema = z.object({
  category: z.string().trim().optional(),
  teacherName: z.string().trim().optional(),
  dayOfWeek: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(7)) // ✅ Correct
    .optional(),
  startTimeAfter: z.string().regex(timeRegex).optional(),
  endTimeBefore: z.string().regex(timeRegex).optional(),
  search: z.string().trim().optional(),
});

export const enrollmentSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
});

export const courseIdSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export const addScheduleSchema = z
  .object({
    dayOfWeek: z
      .number()
      .min(1)
      .max(7) // ✅ Correct
      .int("Day must be between 1 (Monday) and 7 (Sunday)"),
    startTime: z
      .string()
      .regex(timeRegex, "Start time must be in HH:MM format"),
    endTime: z.string().regex(timeRegex, "End time must be in HH:MM format"),
  })
  .refine(
    (data) => {
      const start = data.startTime.split(":").map(Number);
      const end = data.endTime.split(":").map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return endMinutes > startMinutes;
    },
    { message: "End time must be after start time", path: ["endTime"] }
  );

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseFilterInput = z.infer<typeof courseFilterSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type CourseIdInput = z.infer<typeof courseIdSchema>;
