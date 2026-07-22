import { PiggyBank, Target } from "lucide-react";

import { CreateSavingsGoalDialog } from "@/app/(dashboard)/dashboard/savings-goals/_components/create-savings-goal-dialog";
import { SavingsGoalsTable } from "@/app/(dashboard)/dashboard/savings-goals/_components/savings-goals-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { listAccounts } from "@/modules/accounts/application/list-accounts";
import { listSavingsGoals } from "@/modules/savings-goals/application/list-savings-goals";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

export default async function SavingsGoalsPage() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const [goals, accounts] = await Promise.all([
    listSavingsGoals({ userId: session.user.id }, repositories.savingsGoals),
    listAccounts(session.user.id, repositories.accounts),
  ]);
  const activeAccounts = accounts
    .filter((account) => account.isActive)
    .map(({ id, name, balanceInCents }) => ({ id, name, balanceInCents }));
  const trackedGoals = goals.filter((goal) => goal.status !== "CANCELLED");
  const totals = trackedGoals.reduce(
    (result, goal) => ({
      saved: result.saved + goal.savedInCents,
      target: result.target + goal.targetInCents,
    }),
    { saved: 0, target: 0 },
  );
  const activeGoalCount = goals.filter((goal) => goal.status === "ACTIVE").length;

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Planejamento</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Metas
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Transforme planos em valores concretos e acompanhe cada avanço.
          </p>
        </div>
        <CreateSavingsGoalDialog />
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <CardTitle>Progresso consolidado</CardTitle>
          <CardDescription>Metas ativas e concluídas</CardDescription>
        </CardHeader>
        <CardContent className="grid px-0 sm:grid-cols-3 sm:divide-x">
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Total guardado</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(totals.saved)}
            </p>
          </div>
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Objetivo total</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(totals.target)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Metas ativas</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {activeGoalCount}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PiggyBank className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Suas metas</CardTitle>
              <CardDescription>
                {goals.length === 1 ? "1 meta cadastrada" : `${goals.length} metas cadastradas`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {goals.length > 0 ? (
            <SavingsGoalsTable
              goals={goals}
              accounts={activeAccounts}
            />
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Target className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">Crie sua primeira meta</h2>
              <p className="mt-1 max-w-sm text-xs/relaxed text-muted-foreground">
                Defina um objetivo e acompanhe quanto falta para realizá-lo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
