import { Router } from "express";
import { CourseController } from "../controllers/courseController";
import { authenticateToken, authorizeRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import {
  createCourseSchema,
  updateCourseSchema,
  courseFilterSchema,
  courseIdSchema,
  addScheduleSchema,
} from "../validations/course";

const router = Router();

// =================================================================
// 🟢 SECTION 1: SPECIFIC ROUTES (MUST BE AT THE TOP)
// =================================================================

// 1. Student's Active Courses (This MUST be before /:courseId)
router.get(
  "/student/my-courses",
  // 👇 Add this temporary debugger
  (req, res, next) => {
    console.log("1. Request hit /student/my-courses");
    console.log("2. Auth Header:", req.headers.authorization);
    next();
  },
  authenticateToken,
  // authorizeRole(["student"]), // Commented out
  CourseController.getStudentCourses
);

// 2. Teacher's Dashboard Courses
router.get(
  "/teacher/my-courses",
  authenticateToken,
  authorizeRole(["teacher"]),
  CourseController.getTeacherCourses
);

// 3. Browse All Courses (Catalog)
router.get(
  "/getAllCourses",
  validateRequest(courseFilterSchema.partial()),
  CourseController.getCourses
);

// =================================================================
// 🔴 SECTION 2: GENERIC PARAMETER ROUTES (MUST BE AT THE BOTTOM)
// =================================================================

// Get Course By ID
// (If this was at the top, it would "eat" the /student/my-courses request)
router.get(
  "/:courseId",
  // validateRequest(courseIdSchema.pick({ courseId: true })), // Optional: Comment out if validation is too strict causing 404s
  CourseController.getCourseById
);

// --- Teacher Actions (Create/Update/Delete) ---
router.post(
  "/create-course",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateRequest(createCourseSchema),
  CourseController.createCourse
);

router.put(
  "/:courseId",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateRequest(updateCourseSchema),
  CourseController.updateCourse
);

router.delete(
  "/:courseId",
  authenticateToken,
  authorizeRole(["teacher"]),
  CourseController.deleteCourse
);

// --- Scheduling ---
router.post(
  "/:courseId/add-schedule",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateRequest(addScheduleSchema),
  CourseController.addScheduleToCourse
);

// --- Enrollment Actions ---
router.post(
  "/:courseId/enroll",
  authenticateToken,
  authorizeRole(["student"]),
  CourseController.enrollInCourse
);

router.delete(
  "/:courseId/enroll",
  authenticateToken,
  authorizeRole(["student"]),
  CourseController.dropCourse
);

router.get(
  "/:courseId/enrollments",
  authenticateToken,
  authorizeRole(["teacher"]),
  CourseController.getCourseEnrollments
);

router.get(
  "/my-schedule",
  authenticateToken,
  CourseController.getStudentClassSchedule
);

export default router;
