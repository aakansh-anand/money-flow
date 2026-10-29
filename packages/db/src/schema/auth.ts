import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tagSortModeEnum } from "./enums.js";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** Tag list: automatic = by transaction frequency; manual = saved sortOrder. */
  tagSortMode: tagSortModeEnum("tag_sort_mode").notNull().default("automatic"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** bcrypt hash of the opaque refresh token — never the token itself. */
    tokenHash: text("token_hash").notNull(),
    deviceLabel: text("device_label"),
    userAgent: text("user_agent"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** NULL = active. Set on logout, rotation-reuse detection, or remote revoke. */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);
