CREATE UNIQUE INDEX "tags_user_name_lower_idx" ON "tags" USING btree ("user_id", lower("name"));
