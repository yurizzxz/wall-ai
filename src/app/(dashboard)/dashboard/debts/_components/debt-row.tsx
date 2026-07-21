import { CalendarDays, HandCoins } from "lucide-react";

import { PayDebtDialog } from "@/app/(dashboard)/dashboard/debts/_components/pay-debt-dialog";
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

type DebtRowProps = {
  debt: DebtListItem;
  status: DebtStatus;
  accounts: Array<{ id: string; name: string; balanceInCents: number }>;
  categories: Array<{ id: string; name: string }>;
};

export function DebtRow({ debt, status, accounts, categories }: DebtRowProps) {
  const statusDetails = STATUS_DETAILS[status];
  const paidPercentage = Math.min(
    100,
    (debt.paidInCents / debt.totalInCents) * 100,
  );
  const canPay =
    (status === "OPEN" || status === "OVERDUE") && debt.outstandingInCents > 0;

  return (
    <li className="px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <HandCoins className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-medium">{debt.creditor}</h2>
              <Badge variant={statusDetails.variant}>{statusDetails.label}</Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {debt.description}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" />
              {debt.dueAt
                ? `Vence em ${dateFormatter.format(debt.dueAt)}`
                : "Sem vencimento definido"}
            </p>
          </div>
        </div>

        <div className="pl-12 lg:w-64 lg:pl-0">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Pagamento</span>
            <span className="font-mono font-medium tabular-nums">
              {Math.round(paidPercentage)}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Pagamento da dívida com ${debt.creditor}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(paidPercentage)}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatCurrency(debt.paidInCents)} de {formatCurrency(debt.totalInCents)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 pl-12 lg:min-w-56 lg:justify-end lg:pl-0">
          <div className="lg:text-right">
            <p className="font-mono text-sm font-semibold tabular-nums">
              {formatCurrency(debt.outstandingInCents)}
            </p>
            <p className="text-xs text-muted-foreground">Saldo devedor</p>
          </div>
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
      </div>
    </li>
  );
}
