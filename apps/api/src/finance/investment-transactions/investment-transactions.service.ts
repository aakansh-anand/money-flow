import { investmentTransactions, investmentTypes, type Db } from "@kosh/db";
import type {
  CreateInvestmentTransactionInput,
  InvestmentTransaction,
  InvestmentTransactionQuery,
} from "@kosh/shared";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";

import { DB } from "@/database/database.module";
import { serializeInvestmentTransaction } from "@/finance/serialize.util";

@Injectable()
export class InvestmentTransactionsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(
    userId: string,
    query: InvestmentTransactionQuery,
  ): Promise<InvestmentTransaction[]> {
    const conditions = [eq(investmentTransactions.userId, userId)];
    if (query.investmentTypeId) {
      conditions.push(eq(investmentTransactions.investmentTypeId, query.investmentTypeId));
    }

    const rows = await this.db.query.investmentTransactions.findMany({
      where: and(...conditions),
      orderBy: [desc(investmentTransactions.occurredAt), desc(investmentTransactions.id)],
    });
    return rows.map(serializeInvestmentTransaction);
  }

  async create(
    userId: string,
    input: CreateInvestmentTransactionInput,
  ): Promise<InvestmentTransaction> {
    await this.assertTypeOwned(userId, input.investmentTypeId);

    const [row] = await this.db
      .insert(investmentTransactions)
      .values({
        userId,
        investmentTypeId: input.investmentTypeId,
        instrumentName: input.instrumentName,
        type: input.type,
        amount: input.amount,
        occurredAt: new Date(input.occurredAt),
        note: input.note ?? null,
      })
      .returning();
    if (!row) throw new Error("Failed to create investment transaction");
    return serializeInvestmentTransaction(row);
  }

  private async assertTypeOwned(userId: string, typeId: string): Promise<void> {
    const type = await this.db.query.investmentTypes.findFirst({
      where: and(eq(investmentTypes.id, typeId), eq(investmentTypes.userId, userId)),
    });
    if (!type) throw new BadRequestException("Investment type not found");
  }
}
