"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, CircleCheck, Target } from "lucide-react";
import { useMemo } from "react";

import { ContributeToSavingsGoalDialog } from "@/app/(dashboard)/dashboard/savings-goals/_components/contribute-to-savings-goal-dialog";
import type {
  AccountOption,
  CategoryOption,
} from "@/app/(dashboard)/dashboard/savings-goals/_components/contribution-fields";
import { DataTable } from "@/components/common/data-table";
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

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type SavingsGoalsTableProps = {
  goals: SavingsGoalListItem[];
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function SavingsGoalsTable({
  goals,
  accounts,
  categories,
}: SavingsGoalsTableProps) {
  const columns = useMemo<ColumnDef<SavingsGoalListItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Meta",
        cell: ({ row }) => {
          const goal = row.original;
          const status = STATUS_DETAILS[goal.status];
          return (
            <div className="flex min-w-56 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {goal.status === "COMPLETED" ? (
                  <CircleCheck className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <Target className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{goal.name}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  {goal.deadline
                    ? `Prazo em ${dateFormatter.format(goal.deadline)}`
                    : "Sem prazo definido"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "progress",
        header: "Progresso",
        cell: ({ row }) => {
          const goal = row.original;
          const progress = Math.round(goal.progressPercentage);
          return (
            <div className="min-w-56">
              <div className="mb-1.5 flex justify-between gap-3">
                <span className="font-mono font-medium tabular-nums">
                  {formatCurrency(goal.savedInCents)}
                </span>
                <span className="text-muted-foreground">
                  {progress}% de {formatCurrency(goal.targetInCents)}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`Progresso de ${goal.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progressPercentage}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        id: "remaining",
        header: "Falta guardar",
        cell: ({ row }) => {
          const goal = row.original;
          const remaining = Math.max(goal.targetInCents - goal.savedInCents, 0);
          return (
            <div className="flex min-w-48 items-center justify-end gap-4">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(remaining)}
              </span>
              {goal.status === "ACTIVE" ? (
                <ContributeToSavingsGoalDialog
                  goalId={goal.id}
                  goalName={goal.name}
                  accounts={accounts}
                  categories={categories}
                />
              ) : null}
            </div>
          );
        },
      },
    ],
    [accounts, categories],
  );

  return (
    <DataTable
      data={goals}
      columns={columns}
      rightColumn
      cellClassName="py-4"
      containerClassName="rounded-none border-0"
    />
  );
}
