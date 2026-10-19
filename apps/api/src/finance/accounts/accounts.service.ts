import { accounts, type Db } from "@kosh/db";
import type { Account, CreateAccountInput, UpdateAccountInput } from "@kosh/shared";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import { DB } from "@/database/database.module";
import { serializeAccount } from "@/finance/serialize.util";

@Injectable()
export class AccountsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(userId: string): Promise<Account[]> {
    const rows = await this.db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    return rows.map(serializeAccount);
  }

  async create(userId: string, input: CreateAccountInput): Promise<Account> {
    const [row] = await this.db
      .insert(accounts)
      .values({
        userId,
        type: input.type,
        subtype: input.type === "cash" ? null : (input.subtype ?? null),
        name: input.name,
        openingBalance: input.openingBalance,
        currentBalance: input.openingBalance,
      })
      .returning();
    if (!row) throw new Error("Failed to create account");
    return serializeAccount(row);
  }

  async update(userId: string, accountId: string, input: UpdateAccountInput): Promise<Account> {
    const existing = await this.db.query.accounts.findFirst({
      where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
    });
    if (!existing) {
      throw new NotFoundException("Account not found");
    }

    if (existing.type === "cash" && input.subtype !== undefined && input.subtype !== null) {
      throw new BadRequestException("Cash accounts cannot have a subtype");
    }

    const patch: Partial<typeof accounts.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.subtype !== undefined) {
      patch.subtype = existing.type === "cash" ? null : input.subtype;
    }
    if (input.openingBalance !== undefined) {
      const openingBalanceChange = input.openingBalance - existing.openingBalance;
      patch.openingBalance = input.openingBalance;
      patch.currentBalance = existing.currentBalance + openingBalanceChange;
    }

    if (Object.keys(patch).length === 0) {
      return serializeAccount(existing);
    }

    const [row] = await this.db
      .update(accounts)
      .set(patch)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .returning();
    if (!row) throw new NotFoundException("Account not found");
    return serializeAccount(row);
  }
}
