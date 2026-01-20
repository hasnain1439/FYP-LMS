import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollmentController";
import { authenticateToken, authorizeRole } from "../middleware/auth";
import { validateRequest, validateParams } from "../middleware/validation";
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentQuerySchema,
  enrollmentIdSchema,
} from "../validations/enrollment";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateRequest(enrollmentQuerySchema, "query"),
  EnrollmentController.getEnrollments
);
router.post(
  "/",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateRequest(createEnrollmentSchema),
  EnrollmentController.createEnrollment
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateParams(enrollmentIdSchema),
  validateRequest(updateEnrollmentSchema),
  EnrollmentController.updateEnrollment
);

export default router;
