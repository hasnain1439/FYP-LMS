import { Request, Response } from "express";
import { db } from "../db";
import {
  coursesTable,
  enrollmentsTable,
  quizzesTable,
  usersTable,
  quizSubmissionsTable,
  courseSchedulesTable,
} from "../db/schema";
import { eq, count, sql, desc, and, gte, asc } from "drizzle-orm";
import FormData from "form-data";
import axios from "axios";

export class DashboardController {
  // ==========================================
  // 👨‍🏫 TEACHER DASHBOARD
  // ==========================================
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const teacherId = (req as any).user!.userId;

      // 1. STATS
      const [coursesRes, quizzesRes, studentsRes, submissionsRes] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(coursesTable)
            .where(eq(coursesTable.offeredByTeacherId, teacherId)),
          db
            .select({ count: count() })
            .from(quizzesTable)
            .innerJoin(coursesTable, eq(quizzesTable.courseId, coursesTable.id))
            .where(eq(coursesTable.offeredByTeacherId, teacherId)),
          db
            .select({ count: count() })
            .from(enrollmentsTable)
            .innerJoin(
              coursesTable,
              eq(enrollmentsTable.courseId, coursesTable.id)
            )
            .where(eq(coursesTable.offeredByTeacherId, teacherId)),
          db
            .select({ count: count() })
            .from(quizSubmissionsTable)
            .innerJoin(
              quizzesTable,
              eq(quizSubmissionsTable.quizId, quizzesTable.id)
            )
            .innerJoin(coursesTable, eq(quizzesTable.courseId, coursesTable.id))
            .where(eq(coursesTable.offeredByTeacherId, teacherId)),
        ]);

      // 2. CHARTS
      const enrollmentsByMonth = await db.execute(sql`
        SELECT TO_CHAR(e.enrolled_at, 'Mon') as month, COUNT(e.id) as count
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE c.offered_by_teacher_id = ${teacherId} 
        GROUP BY TO_CHAR(e.enrolled_at, 'Mon'), DATE_TRUNC('month', e.enrolled_at)
        ORDER BY DATE_TRUNC('month', e.enrolled_at) ASC
        LIMIT 6
      `);

      const statusDistribution = await db
        .select({ status: enrollmentsTable.status, count: count() })
        .from(enrollmentsTable)
        .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
        .where(eq(coursesTable.offeredByTeacherId, teacherId))
        .groupBy(enrollmentsTable.status);

      const recentActivityRaw = await db
        .select({
          studentFirstName: usersTable.firstName,
          studentLastName: usersTable.lastName,
          courseName: coursesTable.name,
          date: enrollmentsTable.enrolledAt,
        })
        .from(enrollmentsTable)
        .innerJoin(usersTable, eq(enrollmentsTable.studentId, usersTable.id))
        .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
        .where(eq(coursesTable.offeredByTeacherId, teacherId))
        .orderBy(desc(enrollmentsTable.enrolledAt))
        .limit(5);

      const recentActivity = recentActivityRaw.map((item) => ({
        message: `${item.studentFirstName} ${item.studentLastName} enrolled in ${item.courseName}`,
        time: new Date(item.date).toLocaleDateString(),
      }));

      // 3. FETCH TEACHER'S SCHEDULE
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const dayQuery = currentDayOfWeek === 0 
        ? sql`(cs.day_of_week = 0 OR cs.day_of_week = 7)` 
        : sql`cs.day_of_week = ${currentDayOfWeek}`;

      const scheduleRes = await db.execute(sql`
        SELECT 
          cs.id,
          c.id as course_id,
          c.name as title, 
          cs.start_time, 
          cs.end_time, 
          cs.meet_link,
          cs.topic
        FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        WHERE c.offered_by_teacher_id = ${teacherId}
        AND ${dayQuery}
        ORDER BY cs.start_time ASC
      `);

      const scheduleRows = (scheduleRes as any).rows || scheduleRes;

      const formattedSchedule = scheduleRows
        .map((row: any) => {
          const [startH, startM] = row.start_time.split(":").map(Number);
          const [endH, endM] = row.end_time.split(":").map(Number);
          const startTotal = startH * 60 + startM;
          const endTotal = endH * 60 + endM;

          let status = "Upcoming";
          if (currentMinutes >= startTotal - 15 && currentMinutes <= endTotal) {
            status = "Live Now";
          }

          let finalLink = row.meet_link;
          if (!finalLink || finalLink.includes("meet.google.com")) {
            finalLink = `https://meet.jit.si/LMS-Class-${row.id}`;
          }

          const displayDate = new Date();
          displayDate.setHours(startH, startM, 0);

          return {
            id: row.id,
            courseId: row.course_id,
            title: row.title,
            topic: row.topic,
            time: displayDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            status: status,
            meetingLink: finalLink,
          };
        })
        .filter((item: any) => item !== null);

      res.json({
        stats: {
          totalCourses: coursesRes[0].count,
          totalQuizzes: quizzesRes[0].count,
          totalStudents: studentsRes[0].count,
          pendingGrading: submissionsRes[0].count,
        },
        charts: {
          enrollmentTrend: enrollmentsByMonth.rows,
          enrollmentStatus: statusDistribution,
        },
        recentActivity: recentActivity,
        schedule: formattedSchedule,
      });
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  }

  // ==========================================
  // 👨‍🎓 STUDENT DASHBOARD (✅ FIXED)
  // ==========================================
  static async getStudentDashboard(req: Request, res: Response) {
    try {
      const studentId = (req as any).user?.userId;

      if (!studentId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // 1. COURSE STATS
      const [courseStatsRes] = await db
        .select({
          inProgress: count(sql`CASE WHEN ${enrollmentsTable.status} = 'active' THEN 1 END`),
          completed: count(sql`CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END`),
        })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.studentId, studentId));

      // 2. GRADES & QUIZ COUNT
      const gradesData = await db
        .select({
          score: quizSubmissionsTable.score,
          totalMarks: quizzesTable.totalMarks,
        })
        .from(quizSubmissionsTable)
        .innerJoin(quizzesTable, eq(quizSubmissionsTable.quizId, quizzesTable.id))
        .where(eq(quizSubmissionsTable.studentId, studentId));

      let totalPercentage = 0;
      if (gradesData.length > 0) {
        gradesData.forEach((g) => {
          const pct = (Number(g.score) / Number(g.totalMarks)) * 100;
          totalPercentage += pct;
        });
      }

      const finalAvgGrade = gradesData.length > 0 ? Math.round(totalPercentage / gradesData.length) : 0;

      const stats = {
        inProgress: courseStatsRes?.inProgress || 0,
        completed: courseStatsRes?.completed || 0,
        averageGrade: finalAvgGrade,
        quizzesTaken: gradesData.length,
      };

      // 3. LIVE SCHEDULE
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentDayOfWeek = now.getDay();

      const dayQuery = currentDayOfWeek === 0 
        ? sql`(cs.day_of_week = 0 OR cs.day_of_week = 7)` 
        : sql`cs.day_of_week = ${currentDayOfWeek}`;

      // A. Fetch Weekly Classes
      const weeklyClasses = await db.execute(sql`
        SELECT 
          cs.id, 
          c.id as course_id,  -- 👈 ✅ ADDED COURSE ID
          c.name as title, 
          u.first_name || ' ' || u.last_name as instructor,
          cs.start_time, 
          cs.end_time, 
          cs.meet_link as meeting_link,
          'weekly' as type
        FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        JOIN enrollments e ON c.id = e.course_id
        JOIN users u ON c.offered_by_teacher_id = u.id
        WHERE e.student_id = ${studentId}
        AND ${dayQuery}
      `);

      const weeklyRows = (weeklyClasses as any).rows || weeklyClasses;

      const formattedWeekly = weeklyRows
        .map((row: any) => {
          const [startH, startM] = row.start_time.split(":").map(Number);
          const [endH, endM] = row.end_time.split(":").map(Number);
          const startTotalMinutes = startH * 60 + startM;
          const endTotalMinutes = endH * 60 + endM;

          if (currentMinutes > endTotalMinutes) return null;

          let status = "Upcoming";
          if (currentMinutes >= startTotalMinutes - 15 && currentMinutes <= endTotalMinutes) {
            status = "Live Now";
          }

          const displayDate = new Date();
          displayDate.setHours(startH, startM, 0);

          let finalLink = row.meeting_link;
          if (!finalLink || finalLink.includes("meet.google.com")) {
            finalLink = `https://meet.jit.si/LMS-Class-${row.id}`;
          }

          return {
            id: `weekly-${row.id}`,
            courseId: row.course_id, // 👈 ✅ SENDING TO FRONTEND
            title: row.title,
            instructor: row.instructor,
            status: status,
            meetingLink: finalLink,
            day: "Today",
            time: displayDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          };
        })
        .filter((item: any) => item !== null);

      // B. Special Events (Simplified)
      const formattedSpecial = []; // You can add special events logic here if needed

      const combinedSchedule = [...formattedWeekly, ...formattedSpecial];

      // 4. DEADLINES (Existing logic)
      const deadlinesRaw = await db
        .select({
          id: quizzesTable.id,
          title: quizzesTable.title,
          courseName: coursesTable.name,
          dueDate: quizzesTable.deadline,
          submissionId: quizSubmissionsTable.id, 
        })
        .from(quizzesTable)
        .innerJoin(coursesTable, eq(quizzesTable.courseId, coursesTable.id))
        .innerJoin(enrollmentsTable, eq(coursesTable.id, enrollmentsTable.courseId))
        .leftJoin(quizSubmissionsTable, and(eq(quizSubmissionsTable.quizId, quizzesTable.id), eq(quizSubmissionsTable.studentId, studentId)))
        .where(and(eq(enrollmentsTable.studentId, studentId), gte(quizzesTable.deadline, new Date())))
        .orderBy(asc(quizzesTable.deadline))
        .limit(5);

      const deadlines = deadlinesRaw.map((item) => {
        const now = new Date();
        const due = new Date(item.dueDate);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: item.id,
          title: item.title,
          courseName: item.courseName,
          isSubmitted: !!item.submissionId, 
          daysLeft: diffDays <= 0 ? "Due Today" : `${diffDays} days left`,
          formattedDate: due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
      });

      res.json({
        stats,
        schedule: combinedSchedule,
        deadlines,
      });
    } catch (error) {
      console.error("Student Dashboard Error:", error);
      res.status(500).json({ error: "Failed to fetch student dashboard data" });
    }
  }

  // ==========================================
  // 👨‍🏫 TEACHER FACE VERIFICATION (Dashboard)
  // ==========================================
  static async verifyTeacherFace(req: Request, res: Response) {
    try {
      console.log("--------------------------------");
      console.log("📥 Teacher Face Verification Request");
      console.log("👉 File:", req.file ? "File Received" : "No File");

      const teacherId = (req as any).user?.userId;

      // 1. 🛡️ Validation
      if (!teacherId) {
        return res.status(401).json({ error: "Unauthorized: No user ID" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Missing required image file" });
      }

      // 2. 🔍 Fetch Teacher's Face Embedding from DB
      const [teacher] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, teacherId));

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      const storedEmbedding = teacher.faceEmbedding;

      if (!storedEmbedding || storedEmbedding.length === 0) {
        return res.status(400).json({
          error: "Face embedding not registered for this teacher. Please register your face first.",
        });
      }

      // 3. 🤖 Verify Face with AI Service
      try {
        const formData = new FormData();

        // Append image file
        formData.append("image", req.file.buffer, {
          filename: "teacher-face.jpg",
          contentType: req.file.mimetype,
        });

        // Append stored embedding as JSON string
        formData.append("stored_embedding", JSON.stringify(storedEmbedding));
        formData.append("student_id", teacherId); // For logging purposes

        console.log("🔄 Sending to Python service for face verification...");
        console.log("📊 Stored embedding length:", storedEmbedding.length);

        const aiResponse = await axios.post(
          "http://localhost:8000/verify-face",
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 60000, // 60 seconds timeout
          }
        );

        console.log("✅ Python response:", aiResponse.data);

        if (!aiResponse.data.success) {
          return res.status(401).json({
            error: "Face verification failed",
            message: aiResponse.data.message,
          });
        }

        const { is_match, similarity, confidence } = aiResponse.data;

        // Check similarity threshold (typically 0.6+ means match)
        if (!is_match || (similarity && similarity < 0.6)) {
          return res.status(401).json({
            error: "Face does not match",
            similarity: similarity || 0,
            message: "Your face could not be verified. Please try again.",
          });
        }

        // 4. ✅ Face Verified Successfully
        console.log(`✅ Teacher ${teacher.firstName} face verified!`);
        console.log(`   Similarity: ${similarity}, Confidence: ${confidence}`);

        return res.json({
          success: true,
          message: "Face verified successfully!",
          teacher: {
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            role: teacher.role,
          },
          verification: {
            is_match: is_match,
            similarity: similarity || 0,
            confidence: confidence || 0,
          },
        });

      } catch (aiError: any) {
        console.error("🔴 AI Service Error:", aiError.response?.data || aiError.message);

        // Handle specific errors
        if (aiError.response?.status === 422) {
          return res.status(422).json({
            error: "Invalid face image format",
            details: aiError.response?.data?.detail || "Could not process the image",
          });
        }

        if (aiError.code === "ECONNREFUSED") {
          return res.status(503).json({
            error: "Face verification service unavailable",
            message: "AI service is not running. Please try again later.",
          });
        }

        throw aiError; // Re-throw for outer catch
      }

    } catch (error) {
      console.error("🔴 Teacher Face Verification Error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to verify teacher face",
      });
    }
  }
}