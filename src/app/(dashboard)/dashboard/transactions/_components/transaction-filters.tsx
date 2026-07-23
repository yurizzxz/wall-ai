"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KIND_LABELS, TRANSACTION_STATUS_LABELS } from "@/lib/formatters";
import type {
  TransactionKind,
  TransactionStatus,
} from "@/modules/transactions/domain/transaction";

type TransactionFiltersProps = {
  kind?: TransactionKind;
  status?: TransactionStatus;
};

export function TransactionFilters({ kind, status }: TransactionFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(name: "kind" | "status", value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") params.delete(name);
    else params.set(name, value as string);
    params.delete("page");
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={kind ?? "ALL"} onValueChange={(value) => updateFilter("kind", value)}>
        <SelectTrigger className="w-36" aria-label="Filtrar por tipo">
          <SelectValue>{kind ? KIND_LABELS[kind] : "Todos os tipos"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os tipos</SelectItem>
          <SelectItem value="INCOME">Receitas</SelectItem>
          <SelectItem value="EXPENSE">Despesas</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status ?? "ALL"} onValueChange={(value) => updateFilter("status", value)}>
        <SelectTrigger className="w-36" aria-label="Filtrar por status">
          <SelectValue>
            {status ? TRANSACTION_STATUS_LABELS[status] : "Todos os status"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os status</SelectItem>
          <SelectItem value="SETTLED">Liquidados</SelectItem>
          <SelectItem value="PENDING">Pendentes</SelectItem>
          <SelectItem value="CANCELLED">Cancelados</SelectItem>
        </SelectContent>
      </Select>
      {kind || status ? (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X aria-hidden="true" />
          Limpar
        </Button>
      ) : null}
    </div>
  );
}
