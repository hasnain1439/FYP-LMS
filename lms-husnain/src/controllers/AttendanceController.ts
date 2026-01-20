import { Request, Response } from "express";
import { db } from "../config/database";
import {
  attendanceTable,
  courseSchedulesTable,
  enrollmentsTable,
  usersTable,
  coursesTable, // ✅ Ensure coursesTable is imported
} from "../db/schema";
import { eq, and, desc } from "drizzle-orm"; // ✅ Added 'desc' for sorting
import FormData from "form-data";
import axios from "axios";

// Helper for Jitsi Link
const generateMeetingLink = (courseId: string) => {
  return `https://meet.jit.si/LMS-Class-${courseId}`;
};

export class AttendanceController {
  
  // ==========================================
  // 1. MARK ATTENDANCE (AI VERIFICATION)
  // ==========================================
  static async markAttendance(req: Request, res: Response) {
    try {
      console.log("--------------------------------");
      console.log("📥 Attendance Request Received");

      const studentId = (req as any).user?.userId;

      // 1. Get & Clean Data
      const courseId = req.body.courseId || req.body.course_id;
      const rawScheduleId =
        req.body.scheduleId || req.body.schedule_id || req.body.id;

      // Clean 'weekly-' or 'date-' prefix if present
      const scheduleId = rawScheduleId
        ? rawScheduleId.replace("weekly-", "").replace("date-", "")
        : null;

      const uploadedFile = req.file;

      if (!courseId || !uploadedFile) {
        return res
          .status(400)
          .json({ error: "Missing required fields (courseId or image)." });
      }

      // 2. Check Enrollment
      const [enrollment] = await db
        .select()
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            eq(enrollmentsTable.courseId, courseId),
            eq(enrollmentsTable.status, "active")
          )
        );

      if (!enrollment) {
        return res
          .status(403)
          .json({ error: "You are not enrolled in this course." });
      }

      // 3. Check Face ID Registration
      const [student] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, studentId));

      if (!student || !student.faceEmbedding) {
        return res
          .status(403)
          .json({
            error:
              "Face ID not registered. Please upload a profile photo in Settings.",
          });
      }

      // 4. Verify Face with AI
      try {
        const formData = new FormData();
        formData.append("image", uploadedFile.buffer, {
          filename: "face-scan.jpg",
          contentType: uploadedFile.mimetype,
        });

        formData.append("student_id", studentId);
        formData.append(
          "stored_embedding",
          JSON.stringify(student.faceEmbedding)
        );

        console.log("🤖 Sending to Python for verification...");
        const aiResponse = await axios.post(
          "http://localhost:8000/verify-face",
          formData,
          {
            headers: { ...formData.getHeaders() },
          }
        );

        console.log("🤖 AI Response:", aiResponse.data);

        if (aiResponse.data.is_match !== true) {
          return res.status(401).json({
            error: "Face Verification Failed",
            details: `Face does not match. Similarity: ${
              aiResponse.data.similarity?.toFixed(2) || "N/A"
            }`,
          });
        }
      } catch (error: any) {
        console.error("AI Service Error:", error.message);
        return res
          .status(500)
          .json({ error: "Face verification service failed." });
      }

      // 5. Mark Attendance in DB
      const [existing] = await db
        .select()
        .from(attendanceTable)
        .where(
          and(
            eq(attendanceTable.studentId, studentId),
            eq(attendanceTable.scheduleId, scheduleId)
          )
        );

      if (!existing) {
        await db.insert(attendanceTable).values({
          studentId: studentId,
          courseId: courseId,
          scheduleId: scheduleId,
          date: new Date(),
          status: "Present",
        });
      } else {
        console.log("ℹ️ Attendance already marked for this session.");
      }

      // 6. Return Success & Link
      let meetingLink = generateMeetingLink(courseId);
      if (scheduleId) {
        const [schedule] = await db
          .select()
          .from(courseSchedulesTable)
          .where(eq(courseSchedulesTable.id, scheduleId));

        if (schedule && schedule.meetLink) {
          meetingLink = schedule.meetLink;
        }
      }

      res.json({
        success: true,
        message: "Attendance marked! Joining class...",
        meetingLink: meetingLink,
      });
    } catch (error) {
      console.error("Mark Attendance Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // ==========================================
  // 2. GET ATTENDANCE HISTORY (STUDENT)
  // ==========================================
  static async getStudentAttendance(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;

      const records = await db
        .select({
          id: attendanceTable.id,
          date: attendanceTable.date,
          status: attendanceTable.status,
          courseName: coursesTable.name,
          topic: courseSchedulesTable.topic,
          startTime: courseSchedulesTable.startTime,
        })
        .from(attendanceTable)
        .innerJoin(coursesTable, eq(attendanceTable.courseId, coursesTable.id))
        .leftJoin(
          courseSchedulesTable,
          eq(attendanceTable.scheduleId, courseSchedulesTable.id)
        )
        .where(eq(attendanceTable.studentId, studentId))
        .orderBy(desc(attendanceTable.date)); // ✅ Now works with import

      res.json({ success: true, history: records });
    } catch (error) {
      console.error("Get Student Attendance Error:", error);
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  }

  // ==========================================
  // 3. GET ATTENDANCE REPORT (SPECIFIC COURSE)
  // ==========================================
  static async getCourseAttendance(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const teacherId = req.user!.userId;

      // Check Ownership
      const [course] = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, courseId),
            eq(coursesTable.offeredByTeacherId, teacherId)
          )
        );

      if (!course) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to this course." });
      }

      const records = await db
        .select({
          id: attendanceTable.id,
          date: attendanceTable.date,
          status: attendanceTable.status,
          studentName: usersTable.firstName,
          studentLastName: usersTable.lastName,
          studentEmail: usersTable.email,
          topic: courseSchedulesTable.topic,
        })
        .from(attendanceTable)
        .innerJoin(usersTable, eq(attendanceTable.studentId, usersTable.id))
        .leftJoin(
          courseSchedulesTable,
          eq(attendanceTable.scheduleId, courseSchedulesTable.id)
        )
        .where(eq(attendanceTable.courseId, courseId))
        .orderBy(desc(attendanceTable.date));

      res.json({ success: true, attendance: records });
    } catch (error) {
      console.error("Get Course Attendance Error:", error);
      res.status(500).json({ error: "Failed to fetch course attendance" });
    }
  }

  // ==========================================
  // 4. GET ALL ATTENDANCE (TEACHER DASHBOARD)
  // ==========================================
  // ✅ NEW: Allows teacher to see feed of ALL students across ALL courses
  static async getTeacherDashboardHistory(req: Request, res: Response) {
    try {
      const teacherId = req.user!.userId;

      const records = await db
        .select({
          id: attendanceTable.id,
          date: attendanceTable.date,
          status: attendanceTable.status,
          studentName: usersTable.firstName,
          studentEmail: usersTable.email,
          courseName: coursesTable.name,
        })
        .from(attendanceTable)
        .innerJoin(coursesTable, eq(attendanceTable.courseId, coursesTable.id))
        .innerJoin(usersTable, eq(attendanceTable.studentId, usersTable.id))
        .where(eq(coursesTable.offeredByTeacherId, teacherId))
        .orderBy(desc(attendanceTable.date))
        .limit(50); // Optional: Limit to recent 50 for performance

      res.json({ success: true, records });
    } catch (error) {
      console.error("Get Teacher Dashboard Error:", error);
      res.status(500).json({ error: "Failed to fetch records" });
    }
  }
}