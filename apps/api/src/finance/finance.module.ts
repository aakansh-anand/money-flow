import { Module } from "@nestjs/common";

import { AccountsController } from "./accounts/accounts.controller";
import { AccountsService } from "./accounts/accounts.service";
import { ContactsController } from "./contacts/contacts.controller";
import { ContactsService } from "./contacts/contacts.service";
import { DebtsController } from "./debts/debts.controller";
import { DebtsService } from "./debts/debts.service";
import { InvestmentTransactionsController } from "./investment-transactions/investment-transactions.controller";
import { InvestmentTransactionsService } from "./investment-transactions/investment-transactions.service";
import { InvestmentTypesController } from "./investment-types/investment-types.controller";
import { InvestmentTypesService } from "./investment-types/investment-types.service";
import { TagsController } from "./tags/tags.controller";
import { TagsService } from "./tags/tags.service";
import { TransactionsController } from "./transactions/transactions.controller";
import { TransactionsService } from "./transactions/transactions.service";

@Module({
  controllers: [
    AccountsController,
    TagsController,
    TransactionsController,
    InvestmentTypesController,
    InvestmentTransactionsController,
    ContactsController,
    DebtsController,
  ],
  providers: [
    AccountsService,
    TagsService,
    TransactionsService,
    InvestmentTypesService,
    InvestmentTransactionsService,
    ContactsService,
    DebtsService,
  ],
})
export class FinanceModule {}
