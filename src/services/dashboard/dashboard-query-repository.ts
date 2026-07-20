import { and, eq, gte, isNull, lt, ne, notExists, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  debtTable,
  financialAccountTable,
  invoiceTable,
  savingsContributionTable,
  savingsGoalTable,
  transactionTable,
} from "@/db/schema";
import type {
  DashboardQueryRepository,
  DashboardSummary,
} from "@/modules/dashboard/application/get-dashboard-summary";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export function createDashboardQueryRepository(
  authenticatedUserId: string,
): DashboardQueryRepository {
  return {
    async getSummary(input): Promise<DashboardSummary> {
      assertUserScope(authenticatedUserId, input.userId);

      const [
        accountBalances,
        monthlyResult,
        debtResult,
        invoiceResult,
        savingsResult,
        pendingResult,
      ] = await Promise.all([
        db
          .select({
            balanceInCents: sql<number>`
              ${financialAccountTable.initialBalanceInCents}
              + coalesce(sum(
                case
                  when ${transactionTable.status} = 'SETTLED'
                    and ${transactionTable.paymentMethod} <> 'CREDIT_CARD'
                  then case
                    when ${transactionTable.kind} = 'INCOME'
                      then ${transactionTable.amountInCents}
                    else -${transactionTable.amountInCents}
                  end
                  else 0
                end
              ), 0)
            `,
          })
          .from(financialAccountTable)
          .leftJoin(
            transactionTable,
            and(
              eq(transactionTable.accountId, financialAccountTable.id),
              eq(transactionTable.userId, authenticatedUserId),
            ),
          )
          .where(eq(financialAccountTable.userId, authenticatedUserId))
          .groupBy(
            financialAccountTable.id,
            financialAccountTable.initialBalanceInCents,
          ),
        db
          .select({
            incomeInCents: sql<number>`coalesce(sum(
              case when ${transactionTable.kind} = 'INCOME'
                then ${transactionTable.amountInCents} else 0 end
            ), 0)`,
            expenseInCents: sql<number>`coalesce(sum(
              case when ${transactionTable.kind} = 'EXPENSE'
                then ${transactionTable.amountInCents} else 0 end
            ), 0)`,
          })
          .from(transactionTable)
          .where(
            and(
              eq(transactionTable.userId, authenticatedUserId),
              eq(transactionTable.status, "SETTLED"),
              isNull(transactionTable.paidInvoiceId),
              notExists(
                db
                  .select({ id: savingsContributionTable.id })
                  .from(savingsContributionTable)
                  .where(
                    eq(
                      savingsContributionTable.transactionId,
                      transactionTable.id,
                    ),
                  ),
              ),
              gte(transactionTable.occurredAt, input.periodStart),
              lt(transactionTable.occurredAt, input.periodEnd),
            ),
          ),
        db
          .select({
            totalInCents: sql<number>`coalesce(sum(
              ${debtTable.totalInCents} - ${debtTable.paidInCents}
            ), 0)`,
          })
          .from(debtTable)
          .where(
            and(
              eq(debtTable.userId, authenticatedUserId),
              ne(debtTable.status, "PAID"),
              ne(debtTable.status, "CANCELLED"),
            ),
          ),
        db
          .select({
            totalInCents: sql<number>`coalesce(sum(
              ${invoiceTable.totalInCents} - ${invoiceTable.paidInCents}
            ), 0)`,
          })
          .from(invoiceTable)
          .where(
            and(
              eq(invoiceTable.userId, authenticatedUserId),
              ne(invoiceTable.status, "PAID"),
            ),
          ),
        db
          .select({
            totalInCents: sql<number>`coalesce(sum(${savingsGoalTable.savedInCents}), 0)`,
          })
          .from(savingsGoalTable)
          .where(
            and(
              eq(savingsGoalTable.userId, authenticatedUserId),
              ne(savingsGoalTable.status, "CANCELLED"),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(transactionTable)
          .where(
            and(
              eq(transactionTable.userId, authenticatedUserId),
              eq(transactionTable.status, "PENDING"),
            ),
          ),
      ]);

      return {
        totalBalanceInCents: accountBalances.reduce(
          (total, account) => total + Number(account.balanceInCents),
          0,
        ),
        monthlyIncomeInCents: Number(monthlyResult[0]?.incomeInCents ?? 0),
        monthlyExpenseInCents: Number(monthlyResult[0]?.expenseInCents ?? 0),
        pendingDebtsInCents: Number(debtResult[0]?.totalInCents ?? 0),
        openInvoicesInCents: Number(invoiceResult[0]?.totalInCents ?? 0),
        savedInCents: Number(savingsResult[0]?.totalInCents ?? 0),
        pendingTransactionCount: Number(pendingResult[0]?.count ?? 0),
      };
    },
  };
}
