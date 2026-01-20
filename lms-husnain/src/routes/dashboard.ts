import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { authenticateToken } from "../middleware/auth"; // Your auth middleware
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/dashboard/stats
router.get("/stats", authenticateToken, DashboardController.getDashboardStats);
router.get("/student", authenticateToken, DashboardController.getStudentDashboard);

// POST /api/dashboard/verify-teacher-face
// Verify teacher face before dashboard access
router.post(
  "/verify-teacher-face",
  authenticateToken,
  upload.single("image"),
  DashboardController.verifyTeacherFace
);

export default router;
