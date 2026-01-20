import express from "express";
import multer from "multer";
import { AttendanceController } from "../controllers/AttendanceController";
import { authenticateToken } from "../middleware/auth"; // Keeping your auth middleware

const router = express.Router();

// Configure Multer (Buffer storage for face verification)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ==========================================
// 🎓 STUDENT ROUTES
// ==========================================

// 1. Mark Attendance (Upload Face Image)
router.post(
  "/markAttendance",
  authenticateToken,
  upload.single("image"), 
  AttendanceController.markAttendance
);

// 2. Get My Attendance History
// Frontend calls: /api/attendance/student/history
router.get(
  "/student/history",
  authenticateToken,
  AttendanceController.getStudentAttendance
);

// ==========================================
// 👩‍🏫 TEACHER ROUTES
// ==========================================

// 3. Get Teacher Dashboard Feed (Recent Activity for all courses)
// Frontend calls: /api/attendance/teacher/dashboard-history
router.get(
  "/teacher/dashboard-history",
  authenticateToken,
  AttendanceController.getTeacherDashboardHistory
);

// 4. Get Specific Course Attendance Report
// Frontend calls: /api/attendance/teacher/course/:courseId
router.get(
  "/teacher/course/:courseId",
  authenticateToken,
  AttendanceController.getCourseAttendance
);

export default router;