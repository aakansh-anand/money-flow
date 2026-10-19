import { Module } from "@nestjs/common";

import { AccountsController } from "./accounts/accounts.controller";
import { AccountsService } from "./accounts/accounts.service";
import { TagsController } from "./tags/tags.controller";
import { TagsService } from "./tags/tags.service";
import { TransactionsController } from "./transactions/transactions.controller";
import { TransactionsService } from "./transactions/transactions.service";

@Module({
  controllers: [AccountsController, TagsController, TransactionsController],
  providers: [AccountsService, TagsService, TransactionsService],
})
export class FinanceModule {}
