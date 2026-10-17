import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { investmentTxnTypeEnum } from "./enums.js";

export const investmentTypes = pgTable(
  "investment_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /**
     * Manual mark-to-market value in paise, updated by hand.
     * The invested total is NOT stored — it's computed on read as
     * SUM(invest) - SUM(withdraw) over this type's transactions.
     */
    currentValue: bigint("current_value", { mode: "number" })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("investment_types_user_id_idx").on(t.userId)],
);

export const investmentTransactions = pgTable(
  "investment_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    investmentTypeId: uuid("investment_type_id")
      .notNull()
      .references(() => investmentTypes.id, { onDelete: "cascade" }),
    instrumentName: text("instrument_name").notNull(),
    type: investmentTxnTypeEnum("type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("investment_transactions_user_id_idx").on(t.userId),
    index("investment_transactions_type_idx").on(t.investmentTypeId),
  ],
);
