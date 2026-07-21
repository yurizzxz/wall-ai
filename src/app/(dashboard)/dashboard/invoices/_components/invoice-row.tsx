import { CalendarDays, CreditCard } from "lucide-react";

import { CloseInvoiceDialog } from "@/app/(dashboard)/dashboard/invoices/_components/close-invoice-dialog";
import { PayInvoiceDialog } from "@/app/(dashboard)/dashboard/invoices/_components/pay-invoice-dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { InvoiceListItem } from "@/modules/invoices/application/list-invoices";
import type { InvoiceStatus } from "@/modules/invoices/domain/invoice";

const STATUS_DETAILS = {
  OPEN: { label: "Aberta", variant: "secondary" },
  CLOSED: { label: "Fechada", variant: "outline" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
  PAID: { label: "Paga", variant: "default" },
} satisfies Record<
  InvoiceStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
>;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type InvoiceRowProps = {
  invoice: InvoiceListItem;
  canClose: boolean;
  accounts: Array<{ id: string; name: string; balanceInCents: number }>;
  categories: Array<{ id: string; name: string }>;
};

export function InvoiceRow({
  invoice,
  canClose,
  accounts,
  categories,
}: InvoiceRowProps) {
  const status = STATUS_DETAILS[invoice.status];
  const paidPercentage =
    invoice.totalInCents > 0
      ? Math.min(100, (invoice.paidInCents / invoice.totalInCents) * 100)
      : invoice.status === "PAID"
        ? 100
        : 0;
  const canPay =
    (invoice.status === "CLOSED" || invoice.status === "OVERDUE") &&
    invoice.outstandingInCents > 0;

  return (
    <li className="px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <CreditCard className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-medium">{invoice.creditCardName}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dateFormatter.format(invoice.periodStart)}–{dateFormatter.format(invoice.periodEnd)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden="true" />
              Vence em {dateFormatter.format(invoice.dueAt)}
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
            aria-label={`Pagamento da fatura de ${invoice.creditCardName}`}
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
            {formatCurrency(invoice.paidInCents)} de {formatCurrency(invoice.totalInCents)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 pl-12 lg:min-w-64 lg:justify-end lg:pl-0">
          <div className="lg:text-right">
            <p className="font-mono text-sm font-semibold tabular-nums">
              {formatCurrency(invoice.outstandingInCents)}
            </p>
            <p className="text-xs text-muted-foreground">Saldo da fatura</p>
          </div>
          <div className="flex items-center gap-2">
            {canClose ? (
              <CloseInvoiceDialog invoiceId={invoice.id} cardName={invoice.creditCardName} />
            ) : null}
            {canPay ? (
              <PayInvoiceDialog
                invoiceId={invoice.id}
                cardName={invoice.creditCardName}
                outstandingInCents={invoice.outstandingInCents}
                accounts={accounts}
                categories={categories}
              />
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
