import express from "express";
import { UserController } from "../controllers/UserController";
import { verifyToken } from "../middleware/authMiddleware";
import multer from "multer";
import path from "path";

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
const router = express.Router();

// ✅ The Route Used by Settings.jsx
router.put(
  "/profile", 
  verifyToken, 
  upload.single("image"), // 'image' matches formData.append("image", ...)
  UserController.updateProfilePicture
);

export default router;