ALTER TABLE "users" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expires" timestamp;