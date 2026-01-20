import { Request, Response } from "express";
import { db } from "../config/database";
import {
  quizzesTable,
  quizQuestionsTable,
  quizSubmissionsTable,
  coursesTable,
  usersTable,
  enrollmentsTable,
} from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  QuizCreateRequest,
  QuizUpdateRequest,
  QuizSubmissionRequest,
  QuizFilterQuery,
} from "../types/quiz";

export class QuizController {
  //ok
  static async createQuiz(req: Request, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const {
        title,
        courseId,
        timeLimitMinutes,
        marksPerQuestion,
        deadline,
        questions,
      }: QuizCreateRequest = req.body;

      const [course] = await db
        .select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.id, courseId),
            eq(coursesTable.offeredByTeacherId, teacherId)
          )
        );

      if (!course) {
        return res
          .status(404)
          .json({ error: "Course not found or unauthorized" });
      }

      if (new Date(deadline) <= new Date()) {
        return res
          .status(400)
          .json({ error: "Deadline must be in the future" });
      }

      const totalQuestions = questions.length;
      const totalMarks = (totalQuestions * marksPerQuestion).toFixed(2);

      const [quiz] = await db
        .insert(quizzesTable)
        .values({
          title,
          courseId,
          timeLimitMinutes,
          totalQuestions,
          marksPerQuestion: marksPerQuestion.toString(),
          totalMarks,
          deadline: new Date(deadline),
          createdBy: teacherId,
        })
        .returning();

      const questionsToInsert = questions.map((question, index) => ({
        quizId: quiz.id,
        questionText: question.questionText,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        orderIndex: index + 1,
      }));

      await db.insert(quizQuestionsTable).values(questionsToInsert);

      res.status(201).json({
        message: "Quiz created successfully",
        quiz: {
          id: quiz.id,
          title: quiz.title,
          courseId: quiz.courseId,
          timeLimitMinutes: quiz.timeLimitMinutes,
          totalQuestions: quiz.totalQuestions,
          marksPerQuestion: quiz.marksPerQuestion,
          totalMarks: quiz.totalMarks,
          deadline: quiz.deadline,
          status: quiz.status,
        },
      });
    } catch (error) {
      console.error("Create quiz error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getQuizzesForTeacher(req: Request, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const filters: QuizFilterQuery = req.query;

      const whereConditions = [eq(quizzesTable.createdBy, teacherId)];

      if (filters.courseId) {
        whereConditions.push(eq(quizzesTable.courseId, filters.courseId));
      }

      if (filters.status) {
        whereConditions.push(eq(quizzesTable.status, filters.status as any));
      }

      const quizzes = await db
        .select({
          id: quizzesTable.id,
          title: quizzesTable.title,
          courseId: quizzesTable.courseId,
          courseName: coursesTable.name,
          timeLimitMinutes: quizzesTable.timeLimitMinutes,
          totalQuestions: quizzesTable.totalQuestions,
          marksPerQuestion: quizzesTable.marksPerQuestion,
          totalMarks: quizzesTable.totalMarks,
          deadline: quizzesTable.deadline,
          status: quizzesTable.status,
          createdAt: quizzesTable.createdAt,
          submissionCount: sql<number>`COUNT(DISTINCT ${quizSubmissionsTable.id})::int`,
        })
        .from(quizzesTable)
        .leftJoin(coursesTable, eq(quizzesTable.courseId, coursesTable.id))
        .leftJoin(
          quizSubmissionsTable,
          eq(quizSubmissionsTable.quizId, quizzesTable.id)
        )
        .where(and(...whereConditions))
        .groupBy(quizzesTable.id, coursesTable.name)
        .orderBy(desc(quizzesTable.createdAt));

      res.json({
        quizzes: quizzes.map((quiz) => ({
          ...quiz,
        })),
      });
    } catch (error) {
      console.error("Get teacher quizzes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getQuizzesForStudent(req: Request, res: Response) {
    try {
      const studentId = req.user!.userId;
      const filters: QuizFilterQuery = req.query;

      const whereConditions = [
        eq(enrollmentsTable.studentId, studentId),
        eq(enrollmentsTable.status, "active"),
      ];

      if (filters.courseId) {
        whereConditions.push(eq(quizzesTable.courseId, filters.courseId));
      }

      if (filters.status) {
        whereConditions.push(eq(quizzesTable.status, filters.status as any));
      }

      const quizzes = await db
        .select({
          id: quizzesTable.id,
          title: quizzesTable.title, // 1. We select the title here...
          courseId: quizzesTable.courseId,
          courseName: coursesTable.name,
          teacherName: sql<string>`CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName})`,
          timeLimitMinutes: quizzesTable.timeLimitMinutes,
          totalQuestions: quizzesTable.totalQuestions,
          marksPerQuestion: quizzesTable.marksPerQuestion,
          totalMarks: quizzesTable.totalMarks,
          deadline: quizzesTable.deadline,
          status: quizzesTable.status,
          submissionId: quizSubmissionsTable.id,
          submissionScore: quizSubmissionsTable.score,
        })
        .from(quizzesTable)
        .innerJoin(
          enrollmentsTable,
          eq(enrollmentsTable.courseId, quizzesTable.courseId)
        )
        .innerJoin(coursesTable, eq(coursesTable.id, quizzesTable.courseId))
        .innerJoin(
          usersTable,
          eq(usersTable.id, coursesTable.offeredByTeacherId)
        )
        .leftJoin(
          quizSubmissionsTable,
          and(
            eq(quizSubmissionsTable.quizId, quizzesTable.id),
            eq(quizSubmissionsTable.studentId, studentId)
          )
        )
        .where(and(...whereConditions))
        .orderBy(desc(quizzesTable.deadline));

      res.json({
        quizzes: quizzes.map((quiz) => ({
          id: quiz.id,
          title: quiz.title, // ✅ FIX: Use 'quiz.title' (the value), NOT 'quizzesTable.title'
          courseId: quiz.courseId,
          courseName: quiz.courseName,
          teacherName: quiz.teacherName,
          timeLimitMinutes: quiz.timeLimitMinutes,
          totalQuestions: quiz.totalQuestions,
          marksPerQuestion: quiz.marksPerQuestion,
          totalMarks: quiz.totalMarks,
          deadline: quiz.deadline,
          status: quiz.status,
          isSubmitted: !!quiz.submissionId,
          submissionScore: quiz.submissionScore,
        })),
      });
    } catch (error) {
      console.error("Get student quizzes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getQuizById(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const [quiz] = await db
        .select({
          id: quizzesTable.id,
          title: quizzesTable.title,
          courseId: quizzesTable.courseId,
          courseName: coursesTable.name,
          teacherName: sql<string>`CONCAT(${usersTable.firstName}, ' ', ${usersTable.lastName})`,
          timeLimitMinutes: quizzesTable.timeLimitMinutes,
          totalQuestions: quizzesTable.totalQuestions,
          marksPerQuestion: quizzesTable.marksPerQuestion,
          totalMarks: quizzesTable.totalMarks,
          deadline: quizzesTable.deadline,
          status: quizzesTable.status,
          createdBy: quizzesTable.createdBy,
        })
        .from(quizzesTable)
        .innerJoin(coursesTable, eq(coursesTable.id, quizzesTable.courseId))
        .innerJoin(
          usersTable,
          eq(usersTable.id, coursesTable.offeredByTeacherId)
        )
        .where(eq(quizzesTable.id, quizId));

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      if (userRole === "student") {
        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.studentId, userId),
              eq(enrollmentsTable.courseId, quiz.courseId),
              eq(enrollmentsTable.status, "active")
            )
          );

        if (!enrollment) {
          return res.status(403).json({ error: "Not enrolled in this course" });
        }

        const [submission] = await db
          .select()
          .from(quizSubmissionsTable)
          .where(
            and(
              eq(quizSubmissionsTable.quizId, quizId),
              eq(quizSubmissionsTable.studentId, userId)
            )
          );

        if (submission) {
          return res.status(400).json({ error: "Quiz already submitted" });
        }

        if (new Date() > new Date(quiz.deadline)) {
          return res.status(400).json({ error: "Quiz deadline has passed" });
        }
      } else if (userRole === "teacher" && quiz.createdBy !== userId) {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      const questions = await db
        .select({
          id: quizQuestionsTable.id,
          questionText: quizQuestionsTable.questionText,
          options: quizQuestionsTable.options,
          orderIndex: quizQuestionsTable.orderIndex,
          ...(userRole === "teacher" && {
            correctOptionIndex: quizQuestionsTable.correctOptionIndex,
          }),
        })
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quizId))
        .orderBy(quizQuestionsTable.orderIndex);

      res.json({
        quiz: {
          ...quiz,
          questions: questions,
        },
      });
    } catch (error) {
      console.error("Get quiz error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async updateQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const teacherId = req.user!.userId;
      const updates: QuizUpdateRequest = req.body;

      const [quiz] = await db
        .select()
        .from(quizzesTable)
        .where(
          and(
            eq(quizzesTable.id, quizId),
            eq(quizzesTable.createdBy, teacherId)
          )
        );

      if (!quiz) {
        return res
          .status(404)
          .json({ error: "Quiz not found or unauthorized" });
      }

      const submissionCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(quizSubmissionsTable)
        .where(eq(quizSubmissionsTable.quizId, quizId));

      if (submissionCount[0].count > 0 && updates.status !== "closed") {
        return res.status(400).json({
          error: "Cannot modify quiz with existing submissions",
        });
      }

      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.timeLimitMinutes)
        updateData.timeLimitMinutes = updates.timeLimitMinutes;
      if (updates.marksPerQuestion) {
        updateData.marksPerQuestion = updates.marksPerQuestion.toString();
        updateData.totalMarks = (
          quiz.totalQuestions * updates.marksPerQuestion
        ).toFixed(2);
      }
      if (updates.deadline) updateData.deadline = new Date(updates.deadline);
      if (updates.status) updateData.status = updates.status;
      updateData.updatedAt = new Date();

      const [updatedQuiz] = await db
        .update(quizzesTable)
        .set(updateData)
        .where(eq(quizzesTable.id, quizId))
        .returning();

      res.json({
        message: "Quiz updated successfully",
        quiz: updatedQuiz,
      });
    } catch (error) {
      console.error("Update quiz error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deleteQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const teacherId = req.user!.userId;

      const [quiz] = await db
        .select()
        .from(quizzesTable)
        .where(
          and(
            eq(quizzesTable.id, quizId),
            eq(quizzesTable.createdBy, teacherId)
          )
        );

      if (!quiz) {
        return res
          .status(404)
          .json({ error: "Quiz not found or unauthorized" });
      }

      await db.delete(quizzesTable).where(eq(quizzesTable.id, quizId));

      res.json({ message: "Quiz deleted successfully" });
    } catch (error) {
      console.error("Delete quiz error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async updateQuestion(req: Request, res: Response) {
    try {
      const { quizId, questionId } = req.params;
      const teacherId = req.user!.userId;
      const updates = req.body;

      const [quiz] = await db
        .select()
        .from(quizzesTable)
        .where(
          and(
            eq(quizzesTable.id, quizId),
            eq(quizzesTable.createdBy, teacherId)
          )
        );

      if (!quiz) {
        return res
          .status(404)
          .json({ error: "Quiz not found or unauthorized" });
      }

      const [question] = await db
        .select()
        .from(quizQuestionsTable)
        .where(
          and(
            eq(quizQuestionsTable.id, questionId),
            eq(quizQuestionsTable.quizId, quizId)
          )
        );

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      const submissionCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(quizSubmissionsTable)
        .where(eq(quizSubmissionsTable.quizId, quizId));

      if (submissionCount[0].count > 0) {
        return res.status(400).json({
          error: "Cannot modify question with existing submissions",
        });
      }

      const updateData: any = { updatedAt: new Date() };
      if (updates.questionText) updateData.questionText = updates.questionText;
      if (updates.options) updateData.options = updates.options;
      if (updates.correctOptionIndex !== undefined)
        updateData.correctOptionIndex = updates.correctOptionIndex;

      const [updatedQuestion] = await db
        .update(quizQuestionsTable)
        .set(updateData)
        .where(eq(quizQuestionsTable.id, questionId))
        .returning();

      res.json({
        message: "Question updated successfully",
        question: updatedQuestion,
      });
    } catch (error) {
      console.error("Update question error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async submitQuiz(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const studentId = req.user!.userId;
      const { answers }: QuizSubmissionRequest = req.body;

      const [quiz] = await db
        .select()
        .from(quizzesTable)
        .where(eq(quizzesTable.id, quizId));

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const [enrollment] = await db
        .select()
        .from(enrollmentsTable)
        .where(
          and(
            eq(enrollmentsTable.studentId, studentId),
            eq(enrollmentsTable.courseId, quiz.courseId),
            eq(enrollmentsTable.status, "active")
          )
        );

      if (!enrollment) {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }

      if (new Date() > new Date(quiz.deadline)) {
        return res.status(400).json({ error: "Quiz deadline has passed" });
      }

      const [existingSubmission] = await db
        .select()
        .from(quizSubmissionsTable)
        .where(
          and(
            eq(quizSubmissionsTable.quizId, quizId),
            eq(quizSubmissionsTable.studentId, studentId)
          )
        );

      if (existingSubmission) {
        return res.status(400).json({ error: "Quiz already submitted" });
      }

      const questions = await db
        .select()
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quizId));

      if (answers.length !== questions.length) {
        return res.status(400).json({
          error: "All questions must be answered",
        });
      }

      let correctAnswers = 0;
      const evaluatedAnswers = answers.map((answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        if (!question) {
          throw new Error(`Question ${answer.questionId} not found`);
        }

        const isCorrect = question.correctOptionIndex === answer.selectedIndex;
        if (isCorrect) correctAnswers++;

        return {
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex,
          isCorrect,
          correctIndex: question.correctOptionIndex,
        };
      });

      const score = (
        correctAnswers * parseFloat(quiz.marksPerQuestion)
      ).toFixed(2);

      const [submission] = await db
        .insert(quizSubmissionsTable)
        .values({
          quizId,
          studentId,
          answers: answers,
          score,
        })
        .returning();

      res.json({
        message: "Quiz submitted successfully",
        result: {
          id: submission.id,
          score,
          totalMarks: quiz.totalMarks,
          percentage: Math.round(
            (parseFloat(score) / parseFloat(quiz.totalMarks)) * 100
          ),
          submittedAt: submission.submittedAt,
          answers: evaluatedAnswers,
        },
      });
    } catch (error) {
      console.error("Submit quiz error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getSubmissionResult(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const studentId = req.user!.userId;

      const [submission] = await db
        .select({
          id: quizSubmissionsTable.id,
          answers: quizSubmissionsTable.answers,
          score: quizSubmissionsTable.score,
          submittedAt: quizSubmissionsTable.submittedAt,
          totalMarks: quizzesTable.totalMarks,
        })
        .from(quizSubmissionsTable)
        .innerJoin(
          quizzesTable,
          eq(quizzesTable.id, quizSubmissionsTable.quizId)
        )
        .where(
          and(
            eq(quizSubmissionsTable.quizId, quizId),
            eq(quizSubmissionsTable.studentId, studentId)
          )
        );

      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const questions = await db
        .select()
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quizId))
        .orderBy(quizQuestionsTable.orderIndex);

      const submittedAnswers = submission.answers as any[];
      const evaluatedAnswers = submittedAnswers.map((answer: any) => {
        const question = questions.find((q) => q.id === answer.questionId);
        return {
          questionId: answer.questionId,
          selectedIndex: answer.selectedIndex,
          isCorrect: question?.correctOptionIndex === answer.selectedIndex,
          correctIndex: question?.correctOptionIndex,
        };
      });

      res.json({
        result: {
          id: submission.id,
          score: submission.score,
          totalMarks: submission.totalMarks,
          percentage: Math.round(
            (parseFloat(submission.score) / parseFloat(submission.totalMarks)) *
              100
          ),
          submittedAt: submission.submittedAt,
          answers: evaluatedAnswers,
        },
      });
    } catch (error) {
      console.error("Get submission result error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async addQuestion(req: Request, res: Response) {
    try {
      const { quizId } = req.params;
      const teacherId = req.user!.userId;
      const { questionText, options, correctOptionIndex } = req.body;

      // Check if quiz exists and belongs to teacher
      const [quiz] = await db
        .select()
        .from(quizzesTable)
        .where(
          and(
            eq(quizzesTable.id, quizId),
            eq(quizzesTable.createdBy, teacherId)
          )
        );

      if (!quiz) {
        return res
          .status(404)
          .json({ error: "Quiz not found or unauthorized" });
      }

      // Check if quiz has submissions (can't modify if has submissions)
      const submissionCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(quizSubmissionsTable)
        .where(eq(quizSubmissionsTable.quizId, quizId));

      if (submissionCount[0].count > 0) {
        return res.status(400).json({
          error: "Cannot add questions to quiz with existing submissions",
        });
      }

      // Get current question count for order index
      const questionCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quizId));

      // Check quiz question limit (50 max)
      if (questionCount[0].count >= 50) {
        return res.status(400).json({
          error: "Quiz cannot have more than 50 questions",
        });
      }

      // Add the new question
      const [newQuestion] = await db
        .insert(quizQuestionsTable)
        .values({
          quizId,
          questionText,
          options,
          correctOptionIndex,
          orderIndex: questionCount[0].count + 1,
        })
        .returning();

      // Update quiz totals
      const newTotalQuestions = questionCount[0].count + 1;
      const newTotalMarks =
        newTotalQuestions * parseFloat(quiz.marksPerQuestion);

      await db
        .update(quizzesTable)
        .set({
          totalQuestions: newTotalQuestions,
          totalMarks: newTotalMarks.toString(),
          updatedAt: new Date(),
        })
        .where(eq(quizzesTable.id, quizId));

      res.status(201).json({
        message: "Question added successfully",
        question: newQuestion,
        quiz: {
          totalQuestions: newTotalQuestions,
          totalMarks: newTotalMarks,
        },
      });
    } catch (error) {
      console.error("Add question error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async removeQuestion(req: Request, res: Response) {
    try {
      const { quizId, questionId } = req.params;
      const teacherId = req.user!.userId;

      // Check if quiz exists and belongs to teacher
      const [quiz] = await db
        .select()
        .from(quizzesTable)
        .where(
          and(
            eq(quizzesTable.id, quizId),
            eq(quizzesTable.createdBy, teacherId)
          )
        );

      if (!quiz) {
        return res
          .status(404)
          .json({ error: "Quiz not found or unauthorized" });
      }

      // Check if quiz has submissions (can't modify if has submissions)
      const submissionCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(quizSubmissionsTable)
        .where(eq(quizSubmissionsTable.quizId, quizId));

      if (submissionCount[0].count > 0) {
        return res.status(400).json({
          error: "Cannot remove questions from quiz with existing submissions",
        });
      }

      // Check if question exists in this quiz
      const [question] = await db
        .select()
        .from(quizQuestionsTable)
        .where(
          and(
            eq(quizQuestionsTable.id, questionId),
            eq(quizQuestionsTable.quizId, quizId)
          )
        );

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      // Check minimum question requirement (at least 1 question)
      const questionCount = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quizId));

      if (questionCount[0].count <= 1) {
        return res.status(400).json({
          error: "Quiz must have at least 1 question",
        });
      }

      // Remove the question
      await db
        .delete(quizQuestionsTable)
        .where(eq(quizQuestionsTable.id, questionId));

      // Reorder remaining questions
      const remainingQuestions = await db
        .select()
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quizId))
        .orderBy(quizQuestionsTable.orderIndex);

      // Update order indices
      for (let i = 0; i < remainingQuestions.length; i++) {
        await db
          .update(quizQuestionsTable)
          .set({ orderIndex: i + 1 })
          .where(eq(quizQuestionsTable.id, remainingQuestions[i].id));
      }

      // Update quiz totals
      const newTotalQuestions = questionCount[0].count - 1;
      const newTotalMarks =
        newTotalQuestions * parseFloat(quiz.marksPerQuestion);

      await db
        .update(quizzesTable)
        .set({
          totalQuestions: newTotalQuestions,
          totalMarks: newTotalMarks.toString(),
          updatedAt: new Date(),
        })
        .where(eq(quizzesTable.id, quizId));

      res.json({
        message: "Question removed successfully",
        removedQuestionId: questionId,
        quiz: {
          totalQuestions: newTotalQuestions,
          totalMarks: newTotalMarks,
        },
      });
    } catch (error) {
      console.error("Remove question error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
