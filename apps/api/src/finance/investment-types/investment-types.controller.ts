import {
  type CreateInvestmentTypeInput,
  createInvestmentTypeInputSchema,
  type InvestmentType,
  type UpdateInvestmentTypeInput,
  updateInvestmentTypeInputSchema,
} from "@kosh/shared";
import { Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodBody } from "@/common/zod-validation.pipe";
import { InvestmentTypesService } from "./investment-types.service";

@Controller("investment-types")
export class InvestmentTypesController {
  constructor(@Inject(InvestmentTypesService) private readonly types: InvestmentTypesService) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<InvestmentType[]> {
    return this.types.list(auth.userId);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(createInvestmentTypeInputSchema) body: CreateInvestmentTypeInput,
  ): Promise<InvestmentType> {
    return this.types.create(auth.userId, body);
  }

  @Patch(":id")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
    @ZodBody(updateInvestmentTypeInputSchema) body: UpdateInvestmentTypeInput,
  ): Promise<InvestmentType> {
    return this.types.update(auth.userId, id, body);
  }
}
