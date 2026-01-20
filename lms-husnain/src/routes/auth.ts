import { Router } from "express";
import multer from "multer";
import { upload as diskUpload } from "../uploads";
import { AuthController } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  refreshTokenSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validations/auth";

const router = Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post(
  "/register",
  memoryUpload.single("faceImage"),
  validateRequest(registerSchema),
  AuthController.register
);
router.post("/login", memoryUpload.single("faceImage"), AuthController.login);
router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken
);
router.get("/profile", authenticateToken, AuthController.getProfile);
router.put(
  "/profile",
  authenticateToken,
  diskUpload.single("profilePicture"), // use disk storage so file is saved to /uploads
  // validateRequest(profileUpdateSchema), // (Optional: Move this AFTER upload.single if validation checks body)
  AuthController.updateProfile
);
router.post("/logout", AuthController.logout);

router.get("/verify-email/:userId/:token", AuthController.verifyEmail);
router.post(
  "/resend-verification",
  validateRequest(resendVerificationSchema),
  AuthController.resendVerification
);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  "/reset-password/:token",
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);
router.put(
  "/change-password",
  authenticateToken,
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);

export default router;
