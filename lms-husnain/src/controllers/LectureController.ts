import { Request, Response } from "express";
import { db } from "../config/database";
import { coursesTable, courseSchedulesTable, usersTable } from "../db/schema";
import { eq, and } from "drizzle-orm";
import FormData from "form-data";
import axios from "axios";

const generateMeetingLink = (courseId: string) => {
  return `https://meet.jit.si/LMS-Class-${courseId}-${Date.now()}`;
};

export class LectureController {
  
  static async startLectureWithFaceVerification(req: Request, res: Response) {
    try {
      console.log("📥 Start Lecture Request Received");

      const teacherId = (req as any).user?.userId;
      const { courseId } = req.body;
      const uploadedFile = req.file;

      // Clean ID
      const rawScheduleId = req.body.scheduleId || req.body.schedule_id;
      const scheduleId = rawScheduleId 
        ? rawScheduleId.replace("weekly-", "").replace("date-", "") 
        : null;

      if (!courseId || !uploadedFile) {
        return res.status(400).json({ error: "Course ID and Face Image are required." });
      }

      // 1. Verify Ownership
      const [course] = await db
        .select()
        .from(coursesTable)
        .where(and(eq(coursesTable.id, courseId), eq(coursesTable.offeredByTeacherId, teacherId)));

      if (!course) {
        return res.status(403).json({ error: "Unauthorized: You do not own this course." });
      }

      // 2. ✅ FETCH TEACHER FACE DATA
      const [teacher] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, teacherId));

      if (!teacher || !teacher.faceEmbedding) {
        return res.status(400).json({ error: "Teacher face not registered. Please go to profile settings." });
      }

      // 3. Verify with Python
      try {
        const formData = new FormData();
        formData.append('image', uploadedFile.buffer, {
          filename: 'teacher-face.jpg',
          contentType: uploadedFile.mimetype,
        });
        
        formData.append('student_id', teacherId); // Log identifier
        
        // 🚨 CRITICAL: Send stored embedding
        formData.append('stored_embedding', JSON.stringify(teacher.faceEmbedding));

        const aiResponse = await axios.post("http://localhost:8000/verify-face", formData, {
          headers: { ...formData.getHeaders() },
        });

        // 🚨 CRITICAL: Check strict result
        if (aiResponse.data.is_match !== true) {
           return res.status(401).json({ 
             error: "Verification Failed", 
             details: "Face does not match the registered teacher." 
           });
        }

      } catch (aiError: any) {
        console.error("AI Service Error:", aiError.message);
        return res.status(500).json({ error: "Face Verification Service Failed" });
      }

      // 4. Success - Link Logic
      const meetingLink = generateMeetingLink(courseId);

      if (scheduleId) {
        await db
          .update(courseSchedulesTable)
          .set({ meetLink: meetingLink })
          .where(eq(courseSchedulesTable.id, scheduleId));
      }

      res.json({
        success: true,
        message: "Face verified! Class started.",
        meetingLink: meetingLink 
      });

    } catch (error) {
      console.error("Start Lecture Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}