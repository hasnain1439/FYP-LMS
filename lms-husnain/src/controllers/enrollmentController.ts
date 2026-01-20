import { Request, Response } from "express";
import { db } from "../db";
import { enrollmentsTable, usersTable, coursesTable } from "../db/schema";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import {
  enrollmentQuerySchema,
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentIdSchema,
} from "../validations/enrollment";

export class EnrollmentController {
  // 1. GET ALL ENROLLMENTS
  static getEnrollments = async (req: Request, res: Response) => {
    try {
      const query = enrollmentQuerySchema.parse(req.query as unknown);
      const { page, limit, search, status, courseId } = query;

      const offset = (page - 1) * limit;
      const whereConditions = [];

      // Handle Status Filter (Allowing for empty strings)
      if (status && status !== "all")
        whereConditions.push(eq(enrollmentsTable.status, status));
      if (courseId)
        whereConditions.push(eq(enrollmentsTable.courseId, courseId));

      // Handle Search
      if (search) {
        whereConditions.push(
          or(
            ilike(usersTable.firstName, `%${search}%`),
            ilike(usersTable.lastName, `%${search}%`),
            ilike(usersTable.email, `%${search}%`),
            ilike(coursesTable.name, `%${search}%`)
          )
        );
      }

      const data = await db
        .select({
          id: enrollmentsTable.id,
          studentName: sql<string>`concat(${usersTable.firstName}, ' ', ${usersTable.lastName})`,
          studentEmail: usersTable.email,
          courseName: coursesTable.name,
          enrolledAt: enrollmentsTable.enrolledAt,
          status: enrollmentsTable.status,
          progress: enrollmentsTable.progress,
        })
        .from(enrollmentsTable)
        .leftJoin(usersTable, eq(enrollmentsTable.studentId, usersTable.id))
        .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
        .where(and(...whereConditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(enrollmentsTable.enrolledAt));

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(enrollmentsTable)
        .leftJoin(usersTable, eq(enrollmentsTable.studentId, usersTable.id))
        .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
        .where(and(...whereConditions));

      const total = Number(countResult[0]?.count || 0);

      res.status(200).json({
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error("Error getting enrollments:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };

  // 2. CREATE ENROLLMENT
 // 2. CREATE ENROLLMENT
  static createEnrollment = async (req: Request, res: Response) => {
    try {
      const { studentEmail, courseId } = createEnrollmentSchema.parse(req.body);

      // 1. Find Student
      const [student] = await db
        .select({ id: usersTable.id, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.email, studentEmail))
        .limit(1);

      if (!student) return res.status(404).json({ success: false, message: "Student email not found" });
      if (student.role !== "student") return res.status(400).json({ success: false, message: "User is not a student" });

      // 2. Insert Enrollment
      const [newEnrollment] = await db
        .insert(enrollmentsTable)
        .values({
          studentId: student.id,
          courseId,
          status: "active",
          progress: 0,
        })
        .returning();

      res.status(201).json({ success: true, data: newEnrollment });

    } catch (error: any) {
      console.error("Enrollment Error:", error);

      // ✅ FIX: Check BOTH 'error.code' AND 'error.cause.code' (For Drizzle)
      if (
        error.code === '23505' || 
        error.cause?.code === '23505' ||
        (error.message && error.message.includes("unique"))
      ) {
        return res.status(409).json({ 
          success: false, 
          message: "This student is already enrolled in this course." 
        });
      }

      // Validation Errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      
      // Generic Error
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  // 3. UPDATE STATUS
  static updateEnrollment = async (req: Request, res: Response) => {
    try {
      const { id } = enrollmentIdSchema.parse(req.params);
      const updates = updateEnrollmentSchema.parse(req.body);

      const [updated] = await db
        .update(enrollmentsTable)
        .set(updates)
        .where(eq(enrollmentsTable.id, id))
        .returning();

      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Enrollment not found" });

      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
