import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  real,
  integer,
  time,
  decimal,
  serial,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["student", "teacher"]);
export const quizStatusEnum = pgEnum("quiz_status", [
  "draft",
  "published",
  "closed",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  rollNumber: varchar("roll_number", { length: 50 }).unique(),
  profilePicture: text("profile_picture"),
  faceEmbedding: real("face_embedding").array(),
  isActive: boolean("is_active").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSessionsTable = pgTable("user_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRelations = relations(usersTable, ({ many }) => ({
  sessions: many(userSessionsTable),
}));

export const sessionRelations = relations(userSessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userSessionsTable.userId],
    references: [usersTable.id],
  }),
}));

// --- COURSE MANAGEMENT TABLES ---

export const coursesTable = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categories: text("categories").array().notNull(),
  courseCurriculum: text("course_curriculum"),
  totalSessions: integer("total_sessions").notNull(),
  offeredByTeacherId: uuid("offered_by_teacher_id")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Existing Recurring Schedule Table (Weekly: Mon 10am)
export const courseSchedulesTable = pgTable("course_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .references(() => coursesTable.id, { onDelete: "cascade" })
    .notNull(),
  topic: varchar("topic", { length: 255 }), 
  meetLink: text("meet_link"),             
  dayOfWeek: integer("day_of_week").notNull(), 
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ✅ NEW ADDITION: Live Class Session Table (Specific Date: Dec 20, 10am)
// This is required for the "Live Schedule" feature in Student Dashboard
export const classScheduleTable = pgTable("class_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  instructor: varchar("instructor", { length: 255 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  meetingLink: text("meeting_link"), 
  subjectType: varchar("subject_type", { length: 50 })
});

export const enrollmentsTable = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").references(() => usersTable.id).notNull(),
    courseId: uuid("course_id")
      .references(() => coursesTable.id, { onDelete: "cascade" })
      .notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    progress: integer("progress").default(0).notNull(),
    droppedAt: timestamp("dropped_at"),
  },
  (table) => ({
    uniqueEnrollment: uniqueIndex("unique_student_course_idx").on(
      table.studentId,
      table.courseId
    ),
  })
);

// --- ATTENDANCE TABLE ---
export const attendanceTable = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").references(() => usersTable.id).notNull(),
  courseId: uuid("course_id").references(() => coursesTable.id).notNull(),
  scheduleId: uuid("schedule_id").references(() => courseSchedulesTable.id),
  date: timestamp("date").defaultNow(),
  status: text("status").default("Present"), // Present, Absent, Late
});


// --- QUIZ MANAGEMENT TABLES ---

export const quizzesTable = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull().default("Untitled Quiz"),
  courseId: uuid("course_id")
    .references(() => coursesTable.id, { onDelete: "cascade" })
    .notNull(),
  timeLimitMinutes: integer("time_limit_minutes").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  marksPerQuestion: decimal("marks_per_question", {
    precision: 5,
    scale: 2,
  }).notNull(),
  totalMarks: decimal("total_marks", { precision: 5, scale: 2 }).notNull(),
  deadline: timestamp("deadline").notNull(),
  status: quizStatusEnum("status").default("draft").notNull(),
  createdBy: uuid("created_by")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizQuestionsTable = pgTable("quiz_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id")
    .references(() => quizzesTable.id, { onDelete: "cascade" })
    .notNull(),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull(),
  correctOptionIndex: integer("correct_option_index").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizSubmissionsTable = pgTable("quiz_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id")
    .references(() => quizzesTable.id, { onDelete: "cascade" })
    .notNull(),
  studentId: uuid("student_id")
    .references(() => usersTable.id)
    .notNull(),
  answers: jsonb("answers").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- RELATIONS ---

export const courseRelations = relations(coursesTable, ({ one, many }) => ({
  teacher: one(usersTable, {
    fields: [coursesTable.offeredByTeacherId],
    references: [usersTable.id],
  }),
  schedules: many(courseSchedulesTable),
  enrollments: many(enrollmentsTable),
  quizzes: many(quizzesTable),
}));

export const courseScheduleRelations = relations(
  courseSchedulesTable,
  ({ one }) => ({
    course: one(coursesTable, {
      fields: [courseSchedulesTable.courseId],
      references: [coursesTable.id],
    }),
  })
);

export const enrollmentRelations = relations(enrollmentsTable, ({ one }) => ({
  student: one(usersTable, {
    fields: [enrollmentsTable.studentId],
    references: [usersTable.id],
  }),
  course: one(coursesTable, {
    fields: [enrollmentsTable.courseId],
    references: [coursesTable.id],
  }),
}));

export const quizRelations = relations(quizzesTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [quizzesTable.courseId],
    references: [coursesTable.id],
  }),
  teacher: one(usersTable, {
    fields: [quizzesTable.createdBy],
    references: [usersTable.id],
  }),
  questions: many(quizQuestionsTable),
  submissions: many(quizSubmissionsTable),
}));

export const quizQuestionRelations = relations(
  quizQuestionsTable,
  ({ one }) => ({
    quiz: one(quizzesTable, {
      fields: [quizQuestionsTable.quizId],
      references: [quizzesTable.id],
    }),
  })
);

export const quizSubmissionRelations = relations(
  quizSubmissionsTable,
  ({ one }) => ({
    quiz: one(quizzesTable, {
      fields: [quizSubmissionsTable.quizId],
      references: [quizzesTable.id],
    }),
    student: one(usersTable, {
      fields: [quizSubmissionsTable.studentId],
      references: [usersTable.id],
    }),
  })
);

// --- TYPE EXPORTS ---

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type UserSession = typeof userSessionsTable.$inferSelect;
export type NewUserSession = typeof userSessionsTable.$inferInsert;

export type Course = typeof coursesTable.$inferSelect;
export type NewCourse = typeof coursesTable.$inferInsert;

// Existing
export type CourseSchedule = typeof courseSchedulesTable.$inferSelect;
export type NewCourseSchedule = typeof courseSchedulesTable.$inferInsert;

// ✅ NEW ADDITION EXPORTS
export type ClassSchedule = typeof classScheduleTable.$inferSelect;
export type NewClassSchedule = typeof classScheduleTable.$inferInsert;

export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type NewEnrollment = typeof enrollmentsTable.$inferInsert;

export type Quiz = typeof quizzesTable.$inferSelect;
export type NewQuiz = typeof quizzesTable.$inferInsert;
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
export type NewQuizQuestion = typeof quizQuestionsTable.$inferInsert;
export type QuizSubmission = typeof quizSubmissionsTable.$inferSelect;
export type NewQuizSubmission = typeof quizSubmissionsTable.$inferInsert;