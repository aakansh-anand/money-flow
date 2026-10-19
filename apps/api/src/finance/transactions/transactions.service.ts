import { accounts, tags, transactions, type Db } from "@kosh/db";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionPage,
  TransactionQuery,
  UpdateTransactionInput,
} from "@kosh/shared";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, gte, lt, lte, or, sql, type SQL } from "drizzle-orm";

import { DB } from "@/database/database.module";
import { balanceChanges, type BalanceTxShape } from "@/finance/balance.util";
import { serializeTransaction } from "@/finance/serialize.util";

type TxRow = typeof transactions.$inferSelect;

@Injectable()
export class TransactionsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(userId: string, query: TransactionQuery): Promise<TransactionPage> {
    const conditions: SQL[] = [eq(transactions.userId, userId)];

    if (query.accountId) {
      conditions.push(
        or(
          eq(transactions.accountId, query.accountId),
          eq(transactions.fromAccountId, query.accountId),
          eq(transactions.toAccountId, query.accountId),
        )!,
      );
    }
    if (query.tagId) conditions.push(eq(transactions.tagId, query.tagId));
    if (query.from) {
      conditions.push(gte(transactions.occurredAt, new Date(query.from)));
    }
    if (query.to) {
      conditions.push(lte(transactions.occurredAt, new Date(query.to)));
    }

    if (query.cursor) {
      const cursorRow = await this.db.query.transactions.findFirst({
        where: and(eq(transactions.id, query.cursor), eq(transactions.userId, userId)),
      });
      if (!cursorRow) {
        throw new BadRequestException("Invalid cursor");
      }
      conditions.push(
        or(
          lt(transactions.occurredAt, cursorRow.occurredAt),
          and(eq(transactions.occurredAt, cursorRow.occurredAt), lt(transactions.id, cursorRow.id)),
        )!,
      );
    }

    const limit = query.limit;
    const rows = await this.db.query.transactions.findMany({
      where: and(...conditions),
      orderBy: [desc(transactions.occurredAt), desc(transactions.id)],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: items.map(serializeTransaction),
      nextCursor: hasMore ? items.at(-1)!.id : null,
    };
  }

  async create(userId: string, input: CreateTransactionInput): Promise<Transaction> {
    await this.validateCreate(userId, input);

    const values = this.toInsertValues(userId, input);
    const shape = this.toBalanceShapeFromInsert(values);

    return this.db.transaction(async (tx) => {
      await this.applyBalanceChanges(tx, userId, balanceChanges(shape));
      const [row] = await tx.insert(transactions).values(values).returning();
      if (!row) throw new Error("Failed to create transaction");
      return serializeTransaction(row);
    });
  }

  async update(
    userId: string,
    transactionId: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    const existing = await this.db.query.transactions.findFirst({
      where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
    });
    if (!existing) throw new NotFoundException("Transaction not found");

    if (existing.type === "transfer") {
      if (input.accountId !== undefined || input.tagId !== undefined) {
        throw new BadRequestException("Transfers cannot change account or tag");
      }
    } else if (input.accountId !== undefined) {
      await this.assertAccountsOwned(userId, [input.accountId]);
    }

    if (input.tagId) {
      await this.assertTagMatchesType(userId, input.tagId, existing.type);
    }

    const merged = this.mergePatch(existing, input);
    await this.validateBalanceShape(userId, merged);

    const oldShape = this.toBalanceShape(existing);
    const newShape = this.toBalanceShape(merged);

    return this.db.transaction(async (tx) => {
      await this.applyBalanceChanges(tx, userId, balanceChanges(oldShape), -1);
      await this.applyBalanceChanges(tx, userId, balanceChanges(newShape));

      const [row] = await tx
        .update(transactions)
        .set({
          amount: merged.amount,
          note: merged.note,
          occurredAt: merged.occurredAt,
          tagId: merged.tagId,
          accountId: merged.accountId,
          fromAccountId: merged.fromAccountId,
          toAccountId: merged.toAccountId,
        })
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
        .returning();
      if (!row) throw new NotFoundException("Transaction not found");
      return serializeTransaction(row);
    });
  }

  async remove(userId: string, transactionId: string): Promise<void> {
    const existing = await this.db.query.transactions.findFirst({
      where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
    });
    if (!existing) throw new NotFoundException("Transaction not found");

    const shape = this.toBalanceShape(existing);

    await this.db.transaction(async (tx) => {
      await this.applyBalanceChanges(tx, userId, balanceChanges(shape), -1);
      await tx
        .delete(transactions)
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));
    });
  }

  private mergePatch(existing: TxRow, input: UpdateTransactionInput): TxRow {
    return {
      ...existing,
      amount: input.amount ?? existing.amount,
      note: input.note !== undefined ? input.note : existing.note,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : existing.occurredAt,
      tagId: input.tagId !== undefined ? input.tagId : existing.tagId,
      accountId: input.accountId !== undefined ? input.accountId : existing.accountId,
    };
  }

  private toInsertValues(
    userId: string,
    input: CreateTransactionInput,
  ): typeof transactions.$inferInsert {
    const occurredAt = new Date(input.occurredAt);
    if (input.type === "transfer") {
      return {
        userId,
        type: "transfer",
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        amount: input.amount,
        note: input.note ?? null,
        occurredAt,
        accountId: null,
        tagId: null,
      };
    }
    return {
      userId,
      type: input.type,
      accountId: input.accountId,
      amount: input.amount,
      note: input.note ?? null,
      tagId: input.tagId ?? null,
      occurredAt,
      fromAccountId: null,
      toAccountId: null,
    };
  }

  private toBalanceShape(row: TxRow): BalanceTxShape {
    return {
      type: row.type,
      amount: row.amount,
      accountId: row.accountId,
      fromAccountId: row.fromAccountId,
      toAccountId: row.toAccountId,
    };
  }

  private toBalanceShapeFromInsert(row: typeof transactions.$inferInsert): BalanceTxShape {
    return {
      type: row.type,
      amount: row.amount,
      accountId: row.accountId ?? null,
      fromAccountId: row.fromAccountId ?? null,
      toAccountId: row.toAccountId ?? null,
    };
  }

  private async validateCreate(userId: string, input: CreateTransactionInput): Promise<void> {
    if (input.type === "transfer") {
      if (input.fromAccountId === input.toAccountId) {
        throw new BadRequestException("Transfer source and destination must differ");
      }
      await this.assertAccountsOwned(userId, [input.fromAccountId, input.toAccountId]);
      return;
    }

    await this.assertAccountsOwned(userId, [input.accountId]);
    if (input.tagId) {
      await this.assertTagMatchesType(userId, input.tagId, input.type);
    }
  }

  private async validateBalanceShape(userId: string, row: BalanceTxShape): Promise<void> {
    if (row.type === "transfer") {
      if (row.fromAccountId === row.toAccountId) {
        throw new BadRequestException("Transfer source and destination must differ");
      }
      if (row.fromAccountId && row.toAccountId) {
        await this.assertAccountsOwned(userId, [row.fromAccountId, row.toAccountId]);
      }
    } else if (row.accountId) {
      await this.assertAccountsOwned(userId, [row.accountId]);
    }
  }

  private async assertAccountsOwned(userId: string, accountIds: string[]): Promise<void> {
    const unique = [...new Set(accountIds)];
    for (const accountId of unique) {
      const row = await this.db.query.accounts.findFirst({
        where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
      });
      if (!row) throw new NotFoundException(`Account ${accountId} not found`);
    }
  }

  private async assertTagMatchesType(
    userId: string,
    tagId: string,
    txType: "expense" | "income" | "transfer",
  ): Promise<void> {
    if (txType === "transfer") {
      throw new BadRequestException("Transfers cannot have a tag");
    }
    const row = await this.db.query.tags.findFirst({
      where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
    });
    if (!row) throw new NotFoundException("Tag not found");
    if (row.kind !== txType) {
      throw new BadRequestException(
        `Tag kind "${row.kind}" does not match transaction type "${txType}"`,
      );
    }
  }

  private async applyBalanceChanges(
    tx: Pick<Db, "update">,
    userId: string,
    changes: Map<string, number>,
    direction: 1 | -1 = 1,
  ): Promise<void> {
    for (const [accountId, balanceChange] of changes) {
      const applied = balanceChange * direction;
      if (applied === 0) continue;
      const rows = await tx
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${applied}`,
        })
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
        .returning({ id: accounts.id });
      if (rows.length === 0) {
        throw new NotFoundException(`Account ${accountId} not found`);
      }
    }
  }
}
