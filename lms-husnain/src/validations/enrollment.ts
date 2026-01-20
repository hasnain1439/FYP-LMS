import { z } from "zod";

export const enrollmentQuerySchema = z.object({
  search: z.string().optional(),
  // ✅ FIX: Allow "active", "dropped", "completed", "all", OR EMPTY STRING ""
  status: z.enum(["active", "dropped", "completed", "all"]).or(z.literal("")).optional(),
  courseId: z.string().uuid().optional(),
  page: z.string().transform((val) => parseInt(val, 10)).optional().default("1"),
  limit: z.string().transform((val) => parseInt(val, 10)).optional().default("10"),
});

export const createEnrollmentSchema = z.object({
  studentEmail: z.string().email({ message: "Invalid email format" }),
  courseId: z.string().uuid({ message: "Invalid Course ID" }),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["active", "dropped", "completed"]).optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const enrollmentIdSchema = z.object({
  id: z.string().uuid({ message: "Invalid Enrollment ID" }),
});