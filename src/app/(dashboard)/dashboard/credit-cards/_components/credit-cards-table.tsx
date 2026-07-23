"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard } from "lucide-react";

import { DeactivateCreditCardDialog } from "@/app/(dashboard)/dashboard/credit-cards/_components/deactivate-credit-card-dialog";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { CreditCardListItem } from "@/modules/credit-cards/application/list-credit-cards";

const columns: ColumnDef<CreditCardListItem>[] = [
  {
    accessorKey: "name",
    header: "Cartão",
    cell: ({ row }) => {
      const card = row.original;
      return (
        <div className="flex min-w-56 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <CreditCard className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{card.name}</span>
              {!card.isActive ? <Badge variant="outline">Inativo</Badge> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {card.lastFour ? `Final ${card.lastFour} · ` : ""}
              Fecha dia {card.closingDay} · Vence dia {card.dueDay}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    id: "usage",
    header: "Limite utilizado",
    cell: ({ row }) => {
      const card = row.original;
      const percentage = Math.min(
        100,
        Math.max(0, (card.committedInCents / card.limitInCents) * 100),
      );
      return (
        <div className="min-w-56">
          <div className="mb-1.5 flex justify-between gap-3">
            <span className="font-mono font-medium tabular-nums">
              {formatCurrency(card.committedInCents)}
            </span>
            <span className="text-muted-foreground">
              de {formatCurrency(card.limitInCents)}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Uso do limite de ${card.name}`}
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
    id: "available",
    header: "Disponível",
    cell: ({ row }) => {
      const card = row.original;
      return (
        <div className="flex min-w-44 items-center justify-end gap-4">
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(card.availableInCents)}
          </span>
          {card.isActive ? (
            <DeactivateCreditCardDialog cardId={card.id} cardName={card.name} />
          ) : (
            <span className="w-7" aria-hidden="true" />
          )}
        </div>
      );
    },
  },
];

type CreditCardsTableProps = { cards: CreditCardListItem[] };

export function CreditCardsTable({ cards }: CreditCardsTableProps) {
  return (
    <DataTable
      data={cards}
      columns={columns}
      rightColumn
      pageSize={10}
      cellClassName="py-4"
      containerClassName="rounded-none border-0"
      getRowClassName={(card) =>
        !card.isActive ? "opacity-50" : undefined
      }
    />
  );
}
