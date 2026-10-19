import { investmentTransactions, investmentTypes, type Db } from "@kosh/db";
import type {
  CreateInvestmentTypeInput,
  InvestmentType,
  UpdateInvestmentTypeInput,
} from "@kosh/shared";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";

import { DB } from "@/database/database.module";
import { serializeInvestmentType } from "@/finance/serialize.util";

@Injectable()
export class InvestmentTypesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(userId: string): Promise<InvestmentType[]> {
    const rows = await this.db.query.investmentTypes.findMany({
      where: eq(investmentTypes.userId, userId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    const totals = await this.investedTotalsByType(userId);
    return rows.map((row) => serializeInvestmentType(row, totals.get(row.id) ?? 0));
  }

  async create(userId: string, input: CreateInvestmentTypeInput): Promise<InvestmentType> {
    const [row] = await this.db
      .insert(investmentTypes)
      .values({
        userId,
        name: input.name,
        currentValue: input.currentValue,
      })
      .returning();
    if (!row) throw new Error("Failed to create investment type");
    return serializeInvestmentType(row, 0);
  }

  async update(
    userId: string,
    typeId: string,
    input: UpdateInvestmentTypeInput,
  ): Promise<InvestmentType> {
    const existing = await this.db.query.investmentTypes.findFirst({
      where: and(eq(investmentTypes.id, typeId), eq(investmentTypes.userId, userId)),
    });
    if (!existing) throw new NotFoundException("Investment type not found");

    const patch: Partial<typeof investmentTypes.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.currentValue !== undefined) patch.currentValue = input.currentValue;

    if (Object.keys(patch).length === 0) {
      const investedTotal = await this.investedTotalForType(userId, typeId);
      return serializeInvestmentType(existing, investedTotal);
    }

    const [row] = await this.db
      .update(investmentTypes)
      .set(patch)
      .where(and(eq(investmentTypes.id, typeId), eq(investmentTypes.userId, userId)))
      .returning();
    if (!row) throw new NotFoundException("Investment type not found");

    const investedTotal = await this.investedTotalForType(userId, typeId);
    return serializeInvestmentType(row, investedTotal);
  }

  private async investedTotalsByType(userId: string): Promise<Map<string, number>> {
    const rows = await this.db
      .select({
        investmentTypeId: investmentTransactions.investmentTypeId,
        total: sql<number>`coalesce(sum(case when ${investmentTransactions.type} = 'invest' then ${investmentTransactions.amount} else -${investmentTransactions.amount} end), 0)::bigint`,
      })
      .from(investmentTransactions)
      .where(eq(investmentTransactions.userId, userId))
      .groupBy(investmentTransactions.investmentTypeId);

    return new Map(rows.map((row) => [row.investmentTypeId, Number(row.total)]));
  }

  private async investedTotalForType(userId: string, typeId: string): Promise<number> {
    const totals = await this.investedTotalsByType(userId);
    return totals.get(typeId) ?? 0;
  }
}
