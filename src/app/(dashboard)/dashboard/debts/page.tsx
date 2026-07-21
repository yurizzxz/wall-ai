import { HandCoins } from "lucide-react";

import { CreateDebtDialog } from "@/app/(dashboard)/dashboard/debts/_components/create-debt-dialog";
import { DebtRow } from "@/app/(dashboard)/dashboard/debts/_components/debt-row";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { listAccounts } from "@/modules/accounts/application/list-accounts";
import { listCategories } from "@/modules/categories/application/list-categories";
import { listDebts } from "@/modules/debts/application/list-debts";
import { deriveDebtStatus } from "@/modules/debts/domain/debt";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

export default async function DebtsPage() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const [debts, accounts, categories] = await Promise.all([
    listDebts({ userId: session.user.id }, repositories.debts),
    listAccounts(session.user.id, repositories.accounts),
    listCategories(session.user.id, repositories.categories),
  ]);
  const activeAccounts = accounts
    .filter((account) => account.isActive)
    .map(({ id, name, balanceInCents }) => ({ id, name, balanceInCents }));
  const expenseCategories = categories
    .filter(
      (category) =>
        category.isActive &&
        (category.kind === "EXPENSE" || category.kind === "BOTH"),
    )
    .map(({ id, name }) => ({ id, name }));
  const now = new Date();
  const debtsWithStatus = debts.map((debt) => ({
    debt,
    status: deriveDebtStatus(debt, now),
  }));
  const pendingDebts = debtsWithStatus.filter(
    ({ status }) => status === "OPEN" || status === "OVERDUE",
  );
  const outstandingInCents = pendingDebts.reduce(
    (total, { debt }) => total + debt.outstandingInCents,
    0,
  );
  const overdueInCents = debtsWithStatus
    .filter(({ status }) => status === "OVERDUE")
    .reduce((total, { debt }) => total + debt.outstandingInCents, 0);

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Compromissos</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Dívidas
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Organize valores pendentes e acompanhe cada pagamento sem pressão.
          </p>
        </div>
        <CreateDebtDialog />
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <CardTitle>Resumo das dívidas</CardTitle>
          <CardDescription>Valores em aberto e vencidos</CardDescription>
        </CardHeader>
        <CardContent className="grid px-0 sm:grid-cols-3 sm:divide-x">
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Saldo devedor</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(outstandingInCents)}
            </p>
          </div>
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Em atraso</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-destructive">
              {formatCurrency(overdueInCents)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Dívidas pendentes</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {pendingDebts.length}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HandCoins className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Suas dívidas</CardTitle>
              <CardDescription>
                {debts.length === 1 ? "1 dívida cadastrada" : `${debts.length} dívidas cadastradas`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {debts.length > 0 ? (
            <ul className="divide-y" aria-label="Dívidas cadastradas">
              {debtsWithStatus.map(({ debt, status }) => (
                <DebtRow
                  key={debt.id}
                  debt={debt}
                  status={status}
                  accounts={activeAccounts}
                  categories={expenseCategories}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <HandCoins className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">Nenhuma dívida cadastrada</h2>
              <p className="mt-1 max-w-sm text-xs/relaxed text-muted-foreground">
                Registre um compromisso para acompanhar o saldo e os pagamentos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
