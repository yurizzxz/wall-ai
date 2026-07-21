import { CalendarDays, CircleCheck, Target } from "lucide-react";

import { ContributeToSavingsGoalDialog } from "@/app/(dashboard)/dashboard/savings-goals/_components/contribute-to-savings-goal-dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { SavingsGoalListItem } from "@/modules/savings-goals/application/list-savings-goals";
import type { SavingsGoalStatus } from "@/modules/savings-goals/domain/savings-goal";

const STATUS_DETAILS = {
  ACTIVE: { label: "Ativa", variant: "secondary" },
  COMPLETED: { label: "Concluída", variant: "default" },
  CANCELLED: { label: "Cancelada", variant: "outline" },
} satisfies Record<
  SavingsGoalStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
>;

const deadlineFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type SavingsGoalRowProps = {
  goal: SavingsGoalListItem;
  accounts: Array<{ id: string; name: string; balanceInCents: number }>;
  categories: Array<{ id: string; name: string }>;
};

export function SavingsGoalRow({
  goal,
  accounts,
  categories,
}: SavingsGoalRowProps) {
  const status = STATUS_DETAILS[goal.status];
  const remainingInCents = Math.max(goal.targetInCents - goal.savedInCents, 0);
  const progress = Math.round(goal.progressPercentage);

  return (
    <li className="px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            {goal.status === "COMPLETED" ? (
              <CircleCheck className="size-4 text-primary" />
            ) : (
              <Target className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-medium">{goal.name}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" />
              {goal.deadline
                ? `Prazo em ${deadlineFormatter.format(goal.deadline)}`
                : "Sem prazo definido"}
            </p>
          </div>
        </div>

        <div className="pl-12 lg:w-72 lg:pl-0">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-mono font-medium tabular-nums">{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Progresso de ${goal.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${goal.progressPercentage}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{formatCurrency(goal.savedInCents)}</span>
            <span>de {formatCurrency(goal.targetInCents)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pl-12 lg:min-w-48 lg:justify-end lg:pl-0">
          <div className="lg:text-right">
            <p className="font-mono text-sm font-semibold tabular-nums">
              {formatCurrency(remainingInCents)}
            </p>
            <p className="text-xs text-muted-foreground">Falta guardar</p>
          </div>
          {goal.status === "ACTIVE" ? (
            <ContributeToSavingsGoalDialog
              goalId={goal.id}
              goalName={goal.name}
              accounts={accounts}
              categories={categories}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}
