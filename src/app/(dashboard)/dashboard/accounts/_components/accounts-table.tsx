"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Banknote,
  ChartNoAxesCombined,
  Landmark,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

import { DeactivateAccountDialog } from "@/app/(dashboard)/dashboard/accounts/_components/deactivate-account-dialog";
import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { AccountListItem } from "@/modules/accounts/application/list-accounts";
import type { AccountType } from "@/modules/accounts/domain/account";

const ACCOUNT_TYPE_DETAILS = {
  CHECKING: { label: "Conta corrente", icon: Landmark },
  SAVINGS: { label: "Poupança", icon: PiggyBank },
  CASH: { label: "Dinheiro", icon: Banknote },
  INVESTMENT: { label: "Investimentos", icon: ChartNoAxesCombined },
} satisfies Record<AccountType, { label: string; icon: LucideIcon }>;

const columns: ColumnDef<AccountListItem>[] = [
  {
    accessorKey: "name",
    header: "Conta",
    cell: ({ row }) => {
      const account = row.original;
      const { icon: Icon, label } = ACCOUNT_TYPE_DETAILS[account.type];

      return (
        <div className="flex min-w-52 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{account.name}</span>
              {!account.isActive ? <Badge variant="outline">Inativa</Badge> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      );
    },
  },
  {
    id: "balance",
    header: "Saldo atual",
    cell: ({ row }) => {
      const account = row.original;

      return (
        <div className="flex min-w-44 items-center justify-end gap-4">
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(account.balanceInCents)}
          </span>
          {account.isActive ? (
            <DeactivateAccountDialog accountId={account.id} accountName={account.name} />
          ) : (
            <span className="w-7" aria-hidden="true" />
          )}
        </div>
      );
    },
  },
];

type AccountsTableProps = { accounts: AccountListItem[] };

export function AccountsTable({ accounts }: AccountsTableProps) {
  return (
    <DataTable
      data={accounts}
      columns={columns}
      rightColumn
      pageSize={10}
      cellClassName="py-4"
      containerClassName="rounded-none border-0"
      getRowClassName={(account) =>
        !account.isActive ? "opacity-50" : undefined
      }
    />
  );
}
