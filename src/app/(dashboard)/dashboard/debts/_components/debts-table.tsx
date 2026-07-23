"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, HandCoins } from "lucide-react";
import { useMemo } from "react";

import type {
  DebtAccountOption,
  DebtCategoryOption,
} from "@/app/(dashboard)/dashboard/debts/_components/debt-payment-fields";
import { PayDebtDialog } from "@/app/(dashboard)/dashboard/debts/_components/pay-debt-dialog";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { DebtListItem } from "@/modules/debts/application/list-debts";
import type { DebtStatus } from "@/modules/debts/domain/debt";

const STATUS_DETAILS = {
  OPEN: { label: "Em aberto", variant: "secondary" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  PAID: { label: "Paga", variant: "default" },
  CANCELLED: { label: "Cancelada", variant: "outline" },
} satisfies Record<
  DebtStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
>;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export type DebtTableRow = { debt: DebtListItem; status: DebtStatus };

type DebtsTableProps = {
  rows: DebtTableRow[];
  accounts: DebtAccountOption[];
  categories: DebtCategoryOption[];
};

export function DebtsTable({ rows, accounts, categories }: DebtsTableProps) {
  const columns = useMemo<ColumnDef<DebtTableRow>[]>(
    () => [
      {
        id: "debt",
        header: "Dívida",
        cell: ({ row }) => {
          const { debt, status } = row.original;
          const details = STATUS_DETAILS[status];
          return (
            <div className="flex min-w-64 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <HandCoins className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{debt.creditor}</span>
                  <Badge variant={details.variant}>{details.label}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{debt.description}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  {debt.dueAt
                    ? `Vence em ${dateFormatter.format(debt.dueAt)}`
                    : "Sem vencimento definido"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "payment",
        header: "Pagamento",
        cell: ({ row }) => {
          const { debt } = row.original;
          const percentage = Math.min(100, (debt.paidInCents / debt.totalInCents) * 100);
          return (
            <div className="min-w-56">
              <div className="mb-1.5 flex justify-between gap-3">
                <span className="font-mono font-medium tabular-nums">
                  {formatCurrency(debt.paidInCents)}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(percentage)}% de {formatCurrency(debt.totalInCents)}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`Pagamento da dívida com ${debt.creditor}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percentage)}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        id: "outstanding",
        header: "Saldo devedor",
        cell: ({ row }) => {
          const { debt, status } = row.original;
          const canPay =
            (status === "OPEN" || status === "OVERDUE") && debt.outstandingInCents > 0;
          return (
            <div className="flex min-w-52 items-center justify-end gap-4">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(debt.outstandingInCents)}
              </span>
              {canPay ? (
                <PayDebtDialog
                  debtId={debt.id}
                  creditor={debt.creditor}
                  outstandingInCents={debt.outstandingInCents}
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
      data={rows}
      columns={columns}
      rightColumn
      pageSize={10}
      cellClassName="py-4"
      containerClassName="rounded-none border-0"
      getRowClassName={({ status }) =>
        status === "CANCELLED" ? "opacity-50" : undefined
      }
    />
  );
}
