import { z } from "zod";

// UUID parameter validation
export const quizParamsSchema = z.object({
  quizId: z.string().uuid("Invalid quiz ID format"),
});

export const questionParamsSchema = z.object({
  quizId: z.string().uuid("Invalid quiz ID format"),
  questionId: z.string().uuid("Invalid question ID format"),
});

export const quizQuestionSchema = z
  .object({
    questionText: z.string().min(1, "Question text is required").max(1000),
    options: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(2, "At least 2 options required")
      .max(6, "Maximum 6 options allowed"),
    correctOptionIndex: z.number().int().min(0, "Invalid correct option index"),
  })
  .refine((data) => data.correctOptionIndex < data.options.length, {
    message: "Correct option index must be valid for provided options",
    path: ["correctOptionIndex"],
  });

export const createQuizSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(255),
    courseId: z.string().uuid("Invalid course ID"),
    timeLimitMinutes: z
      .number()
      .int()
      .min(1, "Time limit must be at least 1 minute")
      .max(180, "Time limit cannot exceed 3 hours"),
    marksPerQuestion: z
      .number()
      .positive("Marks per question must be positive")
      .max(10, "Maximum 10 marks per question"),
    deadline: z.string().datetime("Invalid deadline format"),
    questions: z
      .array(quizQuestionSchema)
      .min(1, "At least 1 question required")
      .max(50, "Maximum 50 questions allowed"),
  })
  .refine((data) => new Date(data.deadline) > new Date(), {
    message: "Deadline must be in the future",
    path: ["deadline"],
  });

export const updateQuizSchema = z
  .object({
    title: z.string().min(3).max(255).optional(),
    timeLimitMinutes: z
      .number()
      .int()
      .min(1, "Time limit must be at least 1 minute")
      .max(180, "Time limit cannot exceed 3 hours")
      .optional(),
    marksPerQuestion: z
      .number()
      .positive("Marks per question must be positive")
      .max(10, "Maximum 10 marks per question")
      .optional(),
    deadline: z.string().datetime("Invalid deadline format").optional(),
    status: z.enum(["draft", "published", "closed"]).optional(),
  })
  .refine((data) => !data.deadline || new Date(data.deadline) > new Date(), {
    message: "Deadline must be in the future",
    path: ["deadline"],
  });

export const updateQuizQuestionSchema = z
  .object({
    questionText: z
      .string()
      .min(1, "Question text is required")
      .max(1000)
      .optional(),
    options: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(2, "At least 2 options required")
      .max(6, "Maximum 6 options allowed")
      .optional(),
    correctOptionIndex: z
      .number()
      .int()
      .min(0, "Invalid correct option index")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.options && data.correctOptionIndex !== undefined) {
        return data.correctOptionIndex < data.options.length;
      }
      return true;
    },
    {
      message: "Correct option index must be valid for provided options",
      path: ["correctOptionIndex"],
    }
  );

export const submitQuizSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid("Invalid question ID"),
        selectedIndex: z.number().int().min(0, "Invalid selected option index"),
      })
    )
    .min(1, "At least one answer required"),
});

export const addQuestionSchema = z
  .object({
    questionText: z.string().min(1, "Question text is required").max(1000),
    options: z
      .array(z.string().min(1, "Option cannot be empty"))
      .min(2, "At least 2 options required")
      .max(6, "Maximum 6 options allowed"),
    correctOptionIndex: z.number().int().min(0, "Invalid correct option index"),
  })
  .refine((data) => data.correctOptionIndex < data.options.length, {
    message: "Correct option index must be valid for provided options",
    path: ["correctOptionIndex"],
  });
