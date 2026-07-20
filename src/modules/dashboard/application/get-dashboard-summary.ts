import type { AmountInCents } from "../../shared/domain/money";

export type DashboardSummary = {
  totalBalanceInCents: AmountInCents;
  monthlyIncomeInCents: AmountInCents;
  monthlyExpenseInCents: AmountInCents;
  pendingDebtsInCents: AmountInCents;
  openInvoicesInCents: AmountInCents;
  savedInCents: AmountInCents;
  pendingTransactionCount: number;
};

export type GetDashboardSummaryInput = {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
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
    Number.isNaN(input.periodEnd.getTime())
  ) {
    throw new Error("O período do resumo é inválido.");
  }

  if (input.periodStart >= input.periodEnd) {
    throw new Error("O início do período deve vir antes do fim.");
  }

  return repository.getSummary(input);
}
