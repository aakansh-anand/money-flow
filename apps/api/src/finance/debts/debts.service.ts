import { contacts, debtPayments, debts, type Db } from "@kosh/db";
import type {
  CreateDebtInput,
  CreateDebtPaymentInput,
  Debt,
  DebtDetail,
  DebtListQuery,
  DebtPayment,
  UpdateDebtInput,
} from "@kosh/shared";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, sql } from "drizzle-orm";

import { DB } from "@/database/database.module";
import {
  serializeDebt,
  serializeDebtDetail,
  serializeDebtPayment,
} from "@/finance/serialize.util";

type DebtWithContact = {
  debt: typeof debts.$inferSelect;
  contactName: string;
};

@Injectable()
export class DebtsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(userId: string, query: DebtListQuery): Promise<Debt[]> {
    const conditions = [eq(debts.userId, userId)];
    if (query.status) {
      conditions.push(eq(debts.status, query.status));
    }

    const rows = await this.db
      .select({
        debt: debts,
        contactName: contacts.name,
      })
      .from(debts)
      .innerJoin(contacts, eq(debts.contactId, contacts.id))
      .where(and(...conditions))
      .orderBy(asc(debts.createdAt));

    const paid = await this.paymentTotalsByDebt(userId);
    return rows.map(({ debt, contactName }) =>
      serializeDebt(debt, contactName, this.remaining(debt.amount, paid.get(debt.id) ?? 0)),
    );
  }

  async getById(userId: string, debtId: string): Promise<DebtDetail> {
    const row = await this.findDebtWithContact(userId, debtId);
    if (!row) throw new NotFoundException("Debt not found");

    const payments = await this.db.query.debtPayments.findMany({
      where: and(eq(debtPayments.debtId, debtId), eq(debtPayments.userId, userId)),
      orderBy: [asc(debtPayments.paidAt), asc(debtPayments.id)],
    });
    const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return serializeDebtDetail(
      row.debt,
      row.contactName,
      this.remaining(row.debt.amount, paidTotal),
      payments,
    );
  }

  async create(userId: string, input: CreateDebtInput): Promise<Debt> {
    await this.assertContactOwned(userId, input.contactId);

    const [row] = await this.db
      .insert(debts)
      .values({
        userId,
        contactId: input.contactId,
        direction: input.direction,
        amount: input.amount,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      })
      .returning();
    if (!row) throw new Error("Failed to create debt");

    const contact = await this.db.query.contacts.findFirst({
      where: and(eq(contacts.id, input.contactId), eq(contacts.userId, userId)),
    });
    if (!contact) throw new Error("Contact missing after debt create");
    return serializeDebt(row, contact.name, row.amount);
  }

  async update(userId: string, debtId: string, input: UpdateDebtInput): Promise<Debt> {
    const row = await this.findDebtWithContact(userId, debtId);
    if (!row) throw new NotFoundException("Debt not found");
    if (row.debt.status === "settled") {
      throw new BadRequestException("Settled debts cannot be edited");
    }

    const paidTotal = await this.paidTotalForDebt(userId, debtId);
    const patch: Partial<typeof debts.$inferInsert> = {};
    if (input.amount !== undefined) {
      if (input.amount < paidTotal) {
        throw new BadRequestException("Principal cannot be less than payments already recorded");
      }
      patch.amount = input.amount;
    }
    if (input.dueDate !== undefined) {
      patch.dueDate = input.dueDate === null ? null : new Date(input.dueDate);
    }

    if (Object.keys(patch).length === 0) {
      return serializeDebt(
        row.debt,
        row.contactName,
        this.remaining(row.debt.amount, paidTotal),
      );
    }

    const [updated] = await this.db
      .update(debts)
      .set(patch)
      .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundException("Debt not found");

    const principal = updated.amount;
    return serializeDebt(updated, row.contactName, this.remaining(principal, paidTotal));
  }

  async remove(userId: string, debtId: string): Promise<void> {
    const existing = await this.db.query.debts.findFirst({
      where: and(eq(debts.id, debtId), eq(debts.userId, userId)),
    });
    if (!existing) throw new NotFoundException("Debt not found");

    await this.db.delete(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId)));
  }

  async recordPayment(
    userId: string,
    debtId: string,
    input: CreateDebtPaymentInput,
  ): Promise<DebtPayment> {
    const row = await this.findDebtWithContact(userId, debtId);
    if (!row) throw new NotFoundException("Debt not found");
    if (row.debt.status === "settled") {
      throw new BadRequestException("Debt is already settled");
    }

    const paidTotal = await this.paidTotalForDebt(userId, debtId);
    const remaining = this.remaining(row.debt.amount, paidTotal);
    if (input.amount > remaining) {
      throw new BadRequestException("Payment exceeds remaining balance");
    }

    return this.db.transaction(async (tx) => {
      const [payment] = await tx
        .insert(debtPayments)
        .values({
          userId,
          debtId,
          amount: input.amount,
          paidAt: new Date(input.paidAt),
          note: input.note ?? null,
        })
        .returning();
      if (!payment) throw new Error("Failed to record payment");

      const newRemaining = remaining - input.amount;
      if (newRemaining === 0) {
        await tx
          .update(debts)
          .set({
            status: "settled",
            settledAt: new Date(input.paidAt),
          })
          .where(and(eq(debts.id, debtId), eq(debts.userId, userId)));
      }

      return serializeDebtPayment(payment);
    });
  }

  private remaining(principal: number, paidTotal: number): number {
    return principal - paidTotal;
  }

  private async findDebtWithContact(
    userId: string,
    debtId: string,
  ): Promise<DebtWithContact | undefined> {
    const [row] = await this.db
      .select({
        debt: debts,
        contactName: contacts.name,
      })
      .from(debts)
      .innerJoin(contacts, eq(debts.contactId, contacts.id))
      .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
      .limit(1);
    return row;
  }

  private async paymentTotalsByDebt(userId: string): Promise<Map<string, number>> {
    const rows = await this.db
      .select({
        debtId: debtPayments.debtId,
        total: sql<number>`coalesce(sum(${debtPayments.amount}), 0)::bigint`,
      })
      .from(debtPayments)
      .where(eq(debtPayments.userId, userId))
      .groupBy(debtPayments.debtId);

    return new Map(rows.map((row) => [row.debtId, Number(row.total)]));
  }

  private async paidTotalForDebt(userId: string, debtId: string): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${debtPayments.amount}), 0)::bigint`,
      })
      .from(debtPayments)
      .where(and(eq(debtPayments.userId, userId), eq(debtPayments.debtId, debtId)));
    return Number(row?.total ?? 0);
  }

  private async assertContactOwned(userId: string, contactId: string): Promise<void> {
    const contact = await this.db.query.contacts.findFirst({
      where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
    });
    if (!contact) throw new BadRequestException("Contact not found");
  }
}
