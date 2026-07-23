"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, CalendarDays } from "lucide-react";
import { useMemo } from "react";

import { CancelTransactionDialog } from "@/app/(dashboard)/dashboard/transactions/_components/cancel-transaction-dialog";
import { EditTransactionDialog } from "@/app/(dashboard)/dashboard/transactions/_components/edit-transaction-dialog";
import type { TransactionCategoryOption } from "@/app/(dashboard)/dashboard/transactions/_components/transaction-form-fields";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
} from "@/lib/formatters";
import type { TransactionListItem } from "@/modules/transactions/application/list-transactions";
import type { TransactionStatus } from "@/modules/transactions/domain/transaction";

const STATUS_VARIANTS = {
  SETTLED: "default",
  PENDING: "secondary",
  CANCELLED: "outline",
} satisfies Record<TransactionStatus, "default" | "secondary" | "outline">;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type TransactionsTableProps = {
  transactions: TransactionListItem[];
  categories: TransactionCategoryOption[];
  currentPage: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

export function TransactionsTable({
  transactions,
  categories,
  currentPage,
  pageCount,
  pageSize,
  total,
}: TransactionsTableProps) {
  const columns = useMemo<ColumnDef<TransactionListItem>[]>(
    () => [
      {
        id: "transaction",
        header: "Lançamento",
        cell: ({ row }) => {
          const transaction = row.original;
          const isIncome = transaction.kind === "INCOME";
          const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
          return (
            <div className="flex min-w-64 items-center gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-md ${isIncome ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {transaction.description}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {transaction.origin === "SAVINGS_CONTRIBUTION"
                    ? "Movimentação interna"
                    : (transaction.categoryName ?? "Sem categoria")}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "date",
        header: "Data e status",
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="min-w-48">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {dateFormatter.format(transaction.occurredAt)}
                </span>
                <Badge variant={STATUS_VARIANTS[transaction.status]}>
                  {TRANSACTION_STATUS_LABELS[transaction.status]}
                </Badge>
              </div>
              {transaction.dueAt ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  Vence em {dateFormatter.format(transaction.dueAt)}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "source",
        header: "Origem",
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="min-w-48">
              <p className="text-sm font-medium">
                {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                {transaction.installmentCount &&
                transaction.installmentCount > 1
                  ? ` · ${transaction.installmentCount}x`
                  : ""}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {transaction.creditCardName ??
                  transaction.accountName ??
                  "Não informada"}
              </p>
            </div>
          );
        },
      },
      {
        id: "amount",
        header: "Valor",
        cell: ({ row }) => {
          const transaction = row.original;
          const isIncome = transaction.kind === "INCOME";
          const isCancelled = transaction.status === "CANCELLED";
          return (
            <div className="flex min-w-80 items-center justify-end gap-4">
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${isCancelled ? "text-muted-foreground line-through" : isIncome ? "text-emerald-600" : ""}`}
              >
                {isIncome ? "+" : "−"}
                {formatCurrency(transaction.amountInCents)}
              </span>
              {!isCancelled &&
              transaction.origin === "STANDARD" &&
              transaction.categoryId ? (
                <div className="flex items-center gap-1">
                  <EditTransactionDialog
                    transaction={transaction}
                    categories={categories}
                  />
                  <CancelTransactionDialog
                    transactionId={transaction.id}
                    description={transaction.description}
                  />
                </div>
              ) : null}
            </div>
          );
        },
      },
    ],
    [categories],
  );

  return (
    <DataTable
      data={transactions}
      columns={columns}
      rightColumn
      cellClassName="py-4"
      containerClassName="rounded-none border-0"
      currentPage={currentPage}
      pageCount={pageCount}
      pageSize={pageSize}
      total={total}
      getRowClassName={(transaction) =>
        transaction.status === "CANCELLED" ? "opacity-50" : undefined
      }
    />
  );
}
