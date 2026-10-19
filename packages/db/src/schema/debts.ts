import { bigint, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { contactTypeEnum, debtDirectionEnum, debtStatusEnum } from "./enums.js";

/**
 * The other side of a debt — a person, bank, or institution you lent to
 * or borrowed from. Direction lives on the debt, not the contact.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: contactTypeEnum("type").notNull().default("person"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contacts_user_id_idx").on(t.userId)],
);

export const debts = pgTable(
  "debts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    direction: debtDirectionEnum("direction").notNull(),
    /** Original principal in paise. */
    amount: bigint("amount", { mode: "number" }).notNull(),
    /**
     * remaining = amount - SUM(debtPayments.amount), computed on read.
     * When it hits 0 the API sets status=settled + settledAt automatically;
     * the record is kept as history, never hard-deleted on completion.
     */
    status: debtStatusEnum("status").notNull().default("open"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("debts_user_id_idx").on(t.userId), index("debts_contact_id_idx").on(t.contactId)],
);

export const debtPayments = pgTable(
  "debt_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    debtId: uuid("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("debt_payments_user_id_idx").on(t.userId),
    index("debt_payments_debt_id_idx").on(t.debtId),
  ],
);
