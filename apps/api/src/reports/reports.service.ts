import {
  accounts,
  contacts,
  debtPayments,
  debts,
  investmentTypes,
  tags,
  transactions,
  type Db,
} from "@kosh/db";
import type { MonthlyReport } from "@kosh/shared";
import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { DB } from "@/database/database.module";
import { monthBounds } from "./month-bounds.util";

@Injectable()
export class ReportsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async monthly(userId: string, month: string): Promise<MonthlyReport> {
    const { start, end } = monthBounds(month);

    const [categoryBreakdown, perAccountNet, netWorthParts, openDebts] = await Promise.all([
      this.categoryBreakdown(userId, start, end),
      this.perAccountNet(userId, start, end),
      this.netWorthParts(userId),
      this.openDebtsByContact(userId),
    ]);

    const openDebtsOwedByYou = openDebts
      .filter((row) => row.direction === "borrowed")
      .reduce((sum, row) => sum + row.remaining, 0);

    return {
      month,
      categoryBreakdown,
      perAccountNet,
      netWorth: {
        liquid: netWorthParts.liquid,
        investments: netWorthParts.investments,
        openDebtsOwedByYou,
        total: netWorthParts.liquid + netWorthParts.investments - openDebtsOwedByYou,
      },
      openDebts,
    };
  }

  private async categoryBreakdown(userId: string, start: Date, end: Date) {
    const rows = await this.db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        tagColor: tags.color,
        kind: tags.kind,
        total: sql<number>`coalesce(sum(${transactions.amount}), 0)::bigint`,
      })
      .from(transactions)
      .innerJoin(tags, eq(transactions.tagId, tags.id))
      .where(
        and(
          eq(transactions.userId, userId),
          inArray(transactions.type, ["expense", "income"]),
          gte(transactions.occurredAt, start),
          lte(transactions.occurredAt, end),
        ),
      )
      .groupBy(tags.id, tags.name, tags.color, tags.kind)
      .orderBy(asc(tags.name));

    return rows.map((row) => ({
      tagId: row.tagId,
      tagName: row.tagName,
      tagColor: row.tagColor,
      kind: row.kind,
      total: Number(row.total),
    }));
  }

  private async perAccountNet(userId: string, start: Date, end: Date) {
    const rows = await this.db
      .select({
        accountId: accounts.id,
        accountName: accounts.name,
        moneyIn: sql<number>`coalesce(sum(case
          when (${transactions.type} = 'income' and ${transactions.accountId} = ${accounts.id})
            or (${transactions.type} = 'transfer' and ${transactions.toAccountId} = ${accounts.id})
          then ${transactions.amount} else 0 end), 0)::bigint`,
        moneyOut: sql<number>`coalesce(sum(case
          when (${transactions.type} = 'expense' and ${transactions.accountId} = ${accounts.id})
            or (${transactions.type} = 'transfer' and ${transactions.fromAccountId} = ${accounts.id})
          then ${transactions.amount} else 0 end), 0)::bigint`,
      })
      .from(accounts)
      .leftJoin(
        transactions,
        and(
          eq(transactions.userId, accounts.userId),
          gte(transactions.occurredAt, start),
          lte(transactions.occurredAt, end),
          sql`(
            (${transactions.type} in ('expense', 'income') and ${transactions.accountId} = ${accounts.id})
            or (${transactions.type} = 'transfer' and (
              ${transactions.fromAccountId} = ${accounts.id}
              or ${transactions.toAccountId} = ${accounts.id}
            ))
          )`,
        ),
      )
      .where(eq(accounts.userId, userId))
      .groupBy(accounts.id, accounts.name, accounts.createdAt)
      .orderBy(asc(accounts.createdAt));

    return rows.map((row) => {
      const moneyIn = Number(row.moneyIn);
      const moneyOut = Number(row.moneyOut);
      return {
        accountId: row.accountId,
        accountName: row.accountName,
        moneyIn,
        moneyOut,
        net: moneyIn - moneyOut,
      };
    });
  }

  private async netWorthParts(userId: string) {
    const [liquidRow] = await this.db
      .select({
        liquid: sql<number>`coalesce(sum(${accounts.currentBalance}), 0)::bigint`,
      })
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const [investRow] = await this.db
      .select({
        investments: sql<number>`coalesce(sum(${investmentTypes.currentValue}), 0)::bigint`,
      })
      .from(investmentTypes)
      .where(eq(investmentTypes.userId, userId));

    return {
      liquid: Number(liquidRow?.liquid ?? 0),
      investments: Number(investRow?.investments ?? 0),
    };
  }

  private async openDebtsByContact(userId: string) {
    const paidSubquery = this.db
      .select({
        debtId: debtPayments.debtId,
        paid: sql<number>`coalesce(sum(${debtPayments.amount}), 0)::bigint`.as("paid"),
      })
      .from(debtPayments)
      .where(eq(debtPayments.userId, userId))
      .groupBy(debtPayments.debtId)
      .as("paid_totals");

    const remainingExpr = sql<number>`(${debts.amount} - coalesce(${paidSubquery.paid}, 0))`;

    const rows = await this.db
      .select({
        contactId: contacts.id,
        contactName: contacts.name,
        direction: debts.direction,
        remaining: sql<number>`sum(${remainingExpr})::bigint`,
      })
      .from(debts)
      .innerJoin(contacts, eq(debts.contactId, contacts.id))
      .leftJoin(paidSubquery, eq(debts.id, paidSubquery.debtId))
      .where(and(eq(debts.userId, userId), eq(debts.status, "open")))
      .groupBy(contacts.id, contacts.name, debts.direction)
      .having(sql`sum(${remainingExpr}) > 0`)
      .orderBy(asc(contacts.name));

    return rows.map((row) => ({
      contactId: row.contactId,
      contactName: row.contactName,
      direction: row.direction,
      remaining: Number(row.remaining),
    }));
  }
}
