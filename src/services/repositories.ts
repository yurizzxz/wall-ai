import { createAccountRepository } from "@/services/accounts/account-repository";
import { createCategoryRepository } from "@/services/categories/category-repository";
import { createCreditCardRepository } from "@/services/credit-cards/credit-card-repository";
import { createDebtRepository } from "@/services/debts/debt-repository";
import { createDashboardQueryRepository } from "@/services/dashboard/dashboard-query-repository";
import { createInvoiceRepository } from "@/services/invoices/invoice-repository";
import { createRecurrenceRepository } from "@/services/recurrences/recurrence-repository";
import { createSavingsGoalRepository } from "@/services/savings-goals/savings-goal-repository";
import { createTransactionRepository } from "@/services/transactions/transaction-repository";

export function createRepositories(authenticatedUserId: string) {
  return {
    accounts: createAccountRepository(authenticatedUserId),
    categories: createCategoryRepository(authenticatedUserId),
    creditCards: createCreditCardRepository(authenticatedUserId),
    debts: createDebtRepository(authenticatedUserId),
    dashboard: createDashboardQueryRepository(authenticatedUserId),
    invoices: createInvoiceRepository(authenticatedUserId),
    recurrences: createRecurrenceRepository(authenticatedUserId),
    savingsGoals: createSavingsGoalRepository(authenticatedUserId),
    transactions: createTransactionRepository(authenticatedUserId),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
