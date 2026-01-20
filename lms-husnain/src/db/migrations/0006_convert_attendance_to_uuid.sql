-- WARNING: This migration will DROP the existing `attendance` table and recreate it
-- with `uuid` columns for `id`, `student_id`, `course_id`, and `schedule_id`.
-- This will REMOVE any existing attendance rows. Backup your data if needed.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS "attendance";

CREATE TABLE "attendance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
  "schedule_id" uuid REFERENCES "course_schedules"("id"),
  "date" timestamptz DEFAULT now(),
  "status" text DEFAULT 'Present'
);

-- Add an index if you query by student or course often
CREATE INDEX IF NOT EXISTS "attendance_student_idx" ON "attendance" USING btree ("student_id");
CREATE INDEX IF NOT EXISTS "attendance_course_idx" ON "attendance" USING btree ("course_id");
