import {
  type CreateDebtInput,
  createDebtInputSchema,
  type CreateDebtPaymentInput,
  createDebtPaymentInputSchema,
  type Debt,
  type DebtDetail,
  type DebtListQuery,
  debtListQuerySchema,
  type DebtPayment,
  type UpdateDebtInput,
  updateDebtInputSchema,
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
import { DebtsService } from "./debts.service";

@Controller("debts")
export class DebtsController {
  constructor(@Inject(DebtsService) private readonly debts: DebtsService) {}

  @Get()
  list(
    @CurrentAuth() auth: AuthContext,
    @ZodQuery(debtListQuerySchema) query: DebtListQuery,
  ): Promise<Debt[]> {
    return this.debts.list(auth.userId, query);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(createDebtInputSchema) body: CreateDebtInput,
  ): Promise<Debt> {
    return this.debts.create(auth.userId, body);
  }

  @Get(":id")
  getById(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<DebtDetail> {
    return this.debts.getById(auth.userId, id);
  }

  @Patch(":id")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
    @ZodBody(updateDebtInputSchema) body: UpdateDebtInput,
  ): Promise<Debt> {
    return this.debts.update(auth.userId, id, body);
  }

  @HttpCode(204)
  @Delete(":id")
  remove(@CurrentAuth() auth: AuthContext, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.debts.remove(auth.userId, id);
  }

  @Post(":id/payments")
  recordPayment(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
    @ZodBody(createDebtPaymentInputSchema) body: CreateDebtPaymentInput,
  ): Promise<DebtPayment> {
    return this.debts.recordPayment(auth.userId, id, body);
  }
}
