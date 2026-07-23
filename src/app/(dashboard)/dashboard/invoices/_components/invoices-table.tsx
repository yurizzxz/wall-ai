"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, CreditCard } from "lucide-react";
import { useMemo } from "react";

import { CloseInvoiceDialog } from "@/app/(dashboard)/dashboard/invoices/_components/close-invoice-dialog";
import type {
  InvoiceAccountOption,
  InvoiceCategoryOption,
} from "@/app/(dashboard)/dashboard/invoices/_components/invoice-payment-fields";
import { PayInvoiceDialog } from "@/app/(dashboard)/dashboard/invoices/_components/pay-invoice-dialog";
import { DataTable } from "@/components/common/data-table";
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

type InvoicesTableProps = {
  invoices: InvoiceListItem[];
  nowTimestamp: number;
  accounts: InvoiceAccountOption[];
  categories: InvoiceCategoryOption[];
};

export function InvoicesTable({
  invoices,
  nowTimestamp,
  accounts,
  categories,
}: InvoicesTableProps) {
  const columns = useMemo<ColumnDef<InvoiceListItem>[]>(
    () => [
      {
        accessorKey: "creditCardName",
        header: "Fatura",
        cell: ({ row }) => {
          const invoice = row.original;
          const status = STATUS_DETAILS[invoice.status];
          return (
            <div className="flex min-w-64 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <CreditCard className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{invoice.creditCardName}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dateFormatter.format(invoice.periodStart)}–{dateFormatter.format(invoice.periodEnd)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  Vence em {dateFormatter.format(invoice.dueAt)}
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
          const invoice = row.original;
          const percentage = invoice.totalInCents > 0
            ? Math.min(100, (invoice.paidInCents / invoice.totalInCents) * 100)
            : invoice.status === "PAID" ? 100 : 0;
          return (
            <div className="min-w-56">
              <div className="mb-1.5 flex justify-between gap-3">
                <span className="font-mono font-medium tabular-nums">
                  {formatCurrency(invoice.paidInCents)}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(percentage)}% de {formatCurrency(invoice.totalInCents)}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`Pagamento da fatura de ${invoice.creditCardName}`}
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
        header: "Saldo da fatura",
        cell: ({ row }) => {
          const invoice = row.original;
          const canClose =
            invoice.status === "OPEN" &&
            nowTimestamp >= invoice.closingAt.getTime();
          const canPay =
            (invoice.status === "CLOSED" || invoice.status === "OVERDUE") &&
            invoice.outstandingInCents > 0;
          return (
            <div className="flex min-w-64 items-center justify-end gap-4">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(invoice.outstandingInCents)}
              </span>
              <div className="flex gap-2">
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
          );
        },
      },
    ],
    [accounts, categories, nowTimestamp],
  );

  return (
    <DataTable
      data={invoices}
      columns={columns}
      rightColumn
      pageSize={10}
      cellClassName="py-4"
      containerClassName="rounded-none border-0"
    />
  );
}
