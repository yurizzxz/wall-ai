import type { AmountInCents } from "../../shared/domain/money";

export type DashboardSummary = {
  totalBalanceInCents: AmountInCents;
  monthlyIncomeInCents: AmountInCents;
  monthlyExpenseInCents: AmountInCents;
  pendingDebtsInCents: AmountInCents;
  openInvoicesInCents: AmountInCents;
  savedInCents: AmountInCents;
  pendingTransactionCount: number;
  cashFlow: DashboardCashFlowPoint[];
  expensesByCategory: DashboardCategoryExpense[];
};

export type DashboardCashFlowPoint = {
  month: string;
  incomeInCents: AmountInCents;
  expenseInCents: AmountInCents;
};

export type DashboardCategoryExpense = {
  category: string;
  totalInCents: AmountInCents;
};

export type GetDashboardSummaryInput = {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  trendStart: Date;
};

export type DashboardQueryRepository = {
  getSummary(input: GetDashboardSummaryInput): Promise<DashboardSummary>;
};

export async function getDashboardSummary(
  input: GetDashboardSummaryInput,
  repository: DashboardQueryRepository,
): Promise<DashboardSummary> {
  if (!input.userId) {
    throw new Error("O resumo precisa pertencer a um usuário.");
  }

  if (
    Number.isNaN(input.periodStart.getTime()) ||
    Number.isNaN(input.periodEnd.getTime()) ||
    Number.isNaN(input.trendStart.getTime())
  ) {
    throw new Error("O período do resumo é inválido.");
  }

  if (input.periodStart >= input.periodEnd) {
    throw new Error("O início do período deve vir antes do fim.");
  }

  if (input.trendStart > input.periodStart) {
    throw new Error("O histórico do resumo deve começar antes do período atual.");
  }

  return repository.getSummary(input);
}
