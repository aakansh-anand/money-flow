import {
  type CreateInvestmentTransactionInput,
  createInvestmentTransactionInputSchema,
  type InvestmentTransaction,
  type InvestmentTransactionQuery,
  investmentTransactionQuerySchema,
} from "@kosh/shared";
import { Controller, Get, Inject, Post } from "@nestjs/common";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodBody, ZodQuery } from "@/common/zod-validation.pipe";
import { InvestmentTransactionsService } from "./investment-transactions.service";

@Controller("investment-transactions")
export class InvestmentTransactionsController {
  constructor(
    @Inject(InvestmentTransactionsService) private readonly transactions: InvestmentTransactionsService,
  ) {}

  @Get()
  list(
    @CurrentAuth() auth: AuthContext,
    @ZodQuery(investmentTransactionQuerySchema) query: InvestmentTransactionQuery,
  ): Promise<InvestmentTransaction[]> {
    return this.transactions.list(auth.userId, query);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(createInvestmentTransactionInputSchema) body: CreateInvestmentTransactionInput,
  ): Promise<InvestmentTransaction> {
    return this.transactions.create(auth.userId, body);
  }
}
