import {
  type MonthlyReport,
  type MonthlyReportQuery,
  monthlyReportQuerySchema,
} from "@kosh/shared";
import { Controller, Get, Inject } from "@nestjs/common";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodQuery } from "@/common/zod-validation.pipe";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Get("monthly")
  monthly(
    @CurrentAuth() auth: AuthContext,
    @ZodQuery(monthlyReportQuerySchema) query: MonthlyReportQuery,
  ): Promise<MonthlyReport> {
    return this.reports.monthly(auth.userId, query.month);
  }
}
