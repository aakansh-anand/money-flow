ALTER TABLE "tags" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", (row_number() OVER (PARTITION BY "user_id" ORDER BY "created_at" ASC) - 1)::integer AS "rn"
  FROM "tags"
)
UPDATE "tags" SET "sort_order" = "ranked"."rn" FROM "ranked" WHERE "tags"."id" = "ranked"."id";--> statement-breakpoint
CREATE INDEX "tags_user_sort_order_idx" ON "tags" USING btree ("user_id", "sort_order");
