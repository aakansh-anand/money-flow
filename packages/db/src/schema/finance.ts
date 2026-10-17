import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import {
  accountTypeEnum,
  tagKindEnum,
  transactionTypeEnum,
} from "./enums.js";

/** All money columns are integer paise (bigint, mode: "number"). Never floats. */
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: accountTypeEnum("type").notNull(),
    /**
     * Free-text label chosen by the user ("Salary", "Chai fund", whatever)
     * — pure labeling with no effect on balance math. NULL for cash.
     */
    subtype: text("subtype"),
    name: text("name").notNull(),
    openingBalance: bigint("opening_balance", { mode: "number" })
      .notNull()
      .default(0),
    /** Maintained by the API inside a DB transaction on every write. */
    currentBalance: bigint("current_balance", { mode: "number" })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: tagKindEnum("kind").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("tags_user_id_idx").on(t.userId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: transactionTypeEnum("type").notNull(),
    /** Expense/income: the account money left / landed in. NULL for transfers. */
    accountId: uuid("account_id").references(() => accounts.id),
    /** Transfers only (bank -> bank, or bank -> cash for ATM withdrawals). */
    fromAccountId: uuid("from_account_id").references(() => accounts.id),
    toAccountId: uuid("to_account_id").references(() => accounts.id),
    tagId: uuid("tag_id").references(() => tags.id),
    amount: bigint("amount", { mode: "number" }).notNull(),
    note: text("note"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("transactions_user_id_idx").on(t.userId),
    index("transactions_user_occurred_idx").on(t.userId, t.occurredAt),
    index("transactions_tag_id_idx").on(t.tagId),
  ],
);
