"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  RefreshCcw,
} from "lucide-react";
import { useMemo } from "react";

import { ProcessRecurrenceDialog } from "@/app/(dashboard)/dashboard/recurrences/_components/process-recurrence-dialog";
import { DeactivateRecurrenceDialog } from "@/app/(dashboard)/dashboard/recurrences/_components/deactivate-recurrence-dialog";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { RecurrenceListItem } from "@/modules/recurrences/application/list-recurrences";
import type {
  RecurrenceFrequency,
  RecurringTransaction,
} from "@/modules/recurrences/domain/recurrence";

const FREQUENCY_LABELS = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
} satisfies Record<RecurrenceFrequency, string>;

const PAYMENT_METHOD_LABELS = {
  CASH: "Dinheiro",
  PIX: "Pix",
  DEBIT_CARD: "Cartão de débito",
  BANK_TRANSFER: "Transferência bancária",
  CREDIT_CARD: "Cartão de crédito",
} satisfies Record<RecurringTransaction["paymentMethod"], string>;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type RecurrencesTableProps = {
  rows: RecurrenceListItem[];
  nowTimestamp: number;
};

export function RecurrencesTable({ rows, nowTimestamp }: RecurrencesTableProps) {
  const columns = useMemo<ColumnDef<RecurrenceListItem>[]>(
    () => [
      {
        id: "recurrence",
        header: "Recorrência",
        cell: ({ row }) => {
          const recurrence = row.original;
          const isIncome = recurrence.kind === "INCOME";
          const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

          return (
            <div className="flex min-w-64 items-center gap-3">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${isIncome ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{recurrence.description}</span>
                  <Badge variant={recurrence.isActive ? "secondary" : "outline"}>
                    {recurrence.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {recurrence.categoryName} · {isIncome ? "Receita" : "Despesa"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "schedule",
        header: "Agendamento",
        cell: ({ row }) => {
          const recurrence = row.original;
          const isDue =
            recurrence.isActive &&
            recurrence.nextOccurrenceAt.getTime() <= nowTimestamp &&
            (!recurrence.endsAt || recurrence.endsAt.getTime() >= nowTimestamp);
          return (
            <div className="min-w-52">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <RefreshCcw className="size-3.5 text-muted-foreground" aria-hidden="true" />
                {FREQUENCY_LABELS[recurrence.frequency]}
              </p>
              <p className={`mt-1 flex items-center gap-1.5 text-xs ${isDue ? "font-medium text-primary" : "text-muted-foreground"}`}>
                <CalendarClock className="size-3" aria-hidden="true" />
                {isDue ? "Processar desde" : "Próxima em"} {dateFormatter.format(recurrence.nextOccurrenceAt)}
              </p>
              {recurrence.endsAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Termina em {dateFormatter.format(recurrence.endsAt)}
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
          const recurrence = row.original;
          return (
            <div className="min-w-48">
              <p className="text-sm font-medium">{PAYMENT_METHOD_LABELS[recurrence.paymentMethod]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {recurrence.creditCardName ?? recurrence.accountName ?? "Não informada"}
              </p>
            </div>
          );
        },
      },
      {
        id: "amount",
        header: "Valor",
        cell: ({ row }) => {
          const recurrence = row.original;
          const canProcess =
            recurrence.isActive &&
            recurrence.nextOccurrenceAt.getTime() <= nowTimestamp &&
            (!recurrence.endsAt || recurrence.endsAt.getTime() >= nowTimestamp);
          return (
            <div className="flex min-w-80 items-center justify-end gap-4">
              <span className={`font-mono text-sm font-semibold tabular-nums ${recurrence.kind === "INCOME" ? "text-emerald-600" : ""}`}>
                {recurrence.kind === "INCOME" ? "+" : "−"}{formatCurrency(recurrence.amountInCents)}
              </span>
              {recurrence.isActive ? (
                <div className="flex items-center gap-1">
                  {canProcess ? (
                    <ProcessRecurrenceDialog
                      recurrenceId={recurrence.id}
                      description={recurrence.description}
                    />
                  ) : null}
                  <DeactivateRecurrenceDialog
                    recurrenceId={recurrence.id}
                    description={recurrence.description}
                  />
                </div>
              ) : null}
            </div>
          );
        },
      },
    ],
    [nowTimestamp],
  );

  return (
    <DataTable
      data={rows}
      columns={columns}
      rightColumn
      pageSize={10}
      cellClassName="py-4"
      containerClassName="rounded-none border-0"
    />
  );
}
