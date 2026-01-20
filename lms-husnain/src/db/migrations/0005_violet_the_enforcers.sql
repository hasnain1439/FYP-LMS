CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lecture_session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'absent' NOT NULL,
	"joined_at" timestamp,
	"face_verified" boolean DEFAULT false NOT NULL,
	"face_similarity" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"instructor" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"meeting_link" text,
	"subject_type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "lecture_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"meeting_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "course_schedules" ADD COLUMN "topic" varchar(255);--> statement-breakpoint
ALTER TABLE "course_schedules" ADD COLUMN "meet_link" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "title" varchar(255) DEFAULT 'Untitled Quiz' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_lecture_session_id_lecture_sessions_id_fk" FOREIGN KEY ("lecture_session_id") REFERENCES "public"."lecture_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecture_sessions" ADD CONSTRAINT "lecture_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecture_sessions" ADD CONSTRAINT "lecture_sessions_schedule_id_course_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."course_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_lecture_student_idx" ON "attendance" USING btree ("lecture_session_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lecture_session_unique_idx" ON "lecture_sessions" USING btree ("course_id","started_at");--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_student_course_idx" ON "enrollments" USING btree ("student_id","course_id");