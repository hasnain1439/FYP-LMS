import { Router } from "express";
import { QuizController } from "../controllers/quizController";
import { authenticateToken, authorizeRole } from "../middleware/auth";
import { validateRequest, validateParams } from "../middleware/validation";
import {
  createQuizSchema,
  updateQuizSchema,
  updateQuizQuestionSchema,
  submitQuizSchema,
  quizParamsSchema,
  questionParamsSchema,
  addQuestionSchema,
} from "../validations/quiz";

const router = Router();

router.post(
  "/create-quiz",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateRequest(createQuizSchema),
  QuizController.createQuiz
);

router.get(
  "/teacher-quizzes",
  authenticateToken,
  authorizeRole(["teacher"]),
  QuizController.getQuizzesForTeacher
);

router.get(
  "/student-quizzes",
  authenticateToken,
  authorizeRole(["student"]),
  QuizController.getQuizzesForStudent
);

router.get(
  "/:quizId",
  authenticateToken,
  validateParams(quizParamsSchema),
  QuizController.getQuizById
);

router.put(
  "/:quizId",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateParams(quizParamsSchema),
  validateRequest(updateQuizSchema),
  QuizController.updateQuiz
);

router.delete(
  "/:quizId",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateParams(quizParamsSchema),
  QuizController.deleteQuiz
);

router.put(
  "/:quizId/questions/:questionId",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateParams(questionParamsSchema),
  validateRequest(updateQuizQuestionSchema),
  QuizController.updateQuestion
);

router.post(
  "/:quizId/submit",
  authenticateToken,
  authorizeRole(["student"]),
  validateParams(quizParamsSchema),
  validateRequest(submitQuizSchema),
  QuizController.submitQuiz
);

router.get(
  "/:quizId/result",
  authenticateToken,
  authorizeRole(["student"]),
  validateParams(quizParamsSchema),
  QuizController.getSubmissionResult
);

router.post(
  "/:quizId/add-question",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateParams(quizParamsSchema),
  validateRequest(addQuestionSchema),
  QuizController.addQuestion
);

router.delete(
  "/:quizId/questions/:questionId",
  authenticateToken,
  authorizeRole(["teacher"]),
  validateParams(questionParamsSchema),
  QuizController.removeQuestion
);

export default router;
