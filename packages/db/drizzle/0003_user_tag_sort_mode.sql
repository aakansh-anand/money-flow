CREATE TYPE "public"."tag_sort_mode" AS ENUM('automatic', 'manual');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tag_sort_mode" "tag_sort_mode" DEFAULT 'automatic' NOT NULL;
