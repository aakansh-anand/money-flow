import {
  type CreateTransactionInput,
  createTransactionInputSchema,
  type Transaction,
  type TransactionPage,
  type TransactionQuery,
  transactionQuerySchema,
  type UpdateTransactionInput,
  updateTransactionInputSchema,
} from "@kosh/shared";
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodBody, ZodQuery } from "@/common/zod-validation.pipe";
import { TransactionsService } from "./transactions.service";

@Controller("transactions")
export class TransactionsController {
  constructor(@Inject(TransactionsService) private readonly transactions: TransactionsService) {}

  @Get()
  list(
    @CurrentAuth() auth: AuthContext,
    @ZodQuery(transactionQuerySchema) query: TransactionQuery,
  ): Promise<TransactionPage> {
    return this.transactions.list(auth.userId, query);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(createTransactionInputSchema) body: CreateTransactionInput,
  ): Promise<Transaction> {
    return this.transactions.create(auth.userId, body);
  }

  @Patch(":id")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
    @ZodBody(updateTransactionInputSchema) body: UpdateTransactionInput,
  ): Promise<Transaction> {
    return this.transactions.update(auth.userId, id, body);
  }

  @HttpCode(204)
  @Delete(":id")
  remove(@CurrentAuth() auth: AuthContext, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.transactions.remove(auth.userId, id);
  }
}
