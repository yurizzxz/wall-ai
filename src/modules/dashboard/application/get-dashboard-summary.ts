import type { AmountInCents } from "../../shared/domain/money";

export type DashboardIndicators = {
  totalBalanceInCents: AmountInCents;
  monthlyIncomeInCents: AmountInCents;
  monthlyExpenseInCents: AmountInCents;
  pendingTransactionCount: number;
};

export type DashboardCommitments = {
  pendingDebtsInCents: AmountInCents;
  openInvoicesInCents: AmountInCents;
  savedInCents: AmountInCents;
};

export type DashboardChartsData = {
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

export type DashboardPeriodInput = {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
};

export type DashboardTrendInput = DashboardPeriodInput & {
  trendStart: Date;
};

export type DashboardQueryRepository = {
  getIndicators(input: DashboardPeriodInput): Promise<DashboardIndicators>;
  getCharts(input: DashboardTrendInput): Promise<DashboardChartsData>;
  getCommitments(userId: string): Promise<DashboardCommitments>;
};

function assertUserId(userId: string) {
  if (!userId) {
    throw new Error("O resumo precisa pertencer a um usuário.");
  }
}

function assertPeriod(input: DashboardPeriodInput) {
  if (
    Number.isNaN(input.periodStart.getTime()) ||
    Number.isNaN(input.periodEnd.getTime()) ||
    input.periodStart >= input.periodEnd
  ) {
    throw new Error("O período do resumo é inválido.");
  }
}

export async function getDashboardIndicators(
  input: DashboardPeriodInput,
  repository: DashboardQueryRepository,
) {
  assertUserId(input.userId);
  assertPeriod(input);
  return repository.getIndicators(input);
}

export async function getDashboardCharts(
  input: DashboardTrendInput,
  repository: DashboardQueryRepository,
) {
  assertUserId(input.userId);
  assertPeriod(input);

  if (
    Number.isNaN(input.trendStart.getTime()) ||
    input.trendStart > input.periodStart
  ) {
    throw new Error("O histórico do resumo é inválido.");
  }

  return repository.getCharts(input);
}

export async function getDashboardCommitments(
  userId: string,
  repository: DashboardQueryRepository,
) {
  assertUserId(userId);
  return repository.getCommitments(userId);
}
