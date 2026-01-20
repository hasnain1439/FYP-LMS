import { Router } from "express";
import multer from "multer"; // ✅ Import Multer
import { LectureController } from "../controllers/LectureController";
import { authenticateToken } from "../middleware/auth"; 

const router = Router();

// ✅ Configure Multer (Memory Storage for AI)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/startLectureWithFaceVerification",
  authenticateToken, 
  upload.single("image"), // ✅ REQUIRED: This processes the file upload
  LectureController.startLectureWithFaceVerification
);

export default router;