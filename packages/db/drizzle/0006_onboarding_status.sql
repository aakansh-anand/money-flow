CREATE TYPE "public"."onboarding_status" AS ENUM('started', 'in-progress', 'completed');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_status" "onboarding_status" DEFAULT 'started' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_step" integer;--> statement-breakpoint
UPDATE "users" SET "onboarding_status" = 'completed' WHERE "is_onboarded" = true;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_onboarded";
