import {
  type Account,
  type CreateAccountInput,
  createAccountInputSchema,
  type UpdateAccountInput,
  updateAccountInputSchema,
} from "@kosh/shared";
import { Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodBody } from "@/common/zod-validation.pipe";
import { AccountsService } from "./accounts.service";

@Controller("accounts")
export class AccountsController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<Account[]> {
    return this.accounts.list(auth.userId);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(createAccountInputSchema) body: CreateAccountInput,
  ): Promise<Account> {
    return this.accounts.create(auth.userId, body);
  }

  @Patch(":id")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
    @ZodBody(updateAccountInputSchema) body: UpdateAccountInput,
  ): Promise<Account> {
    return this.accounts.update(auth.userId, id, body);
  }
}
