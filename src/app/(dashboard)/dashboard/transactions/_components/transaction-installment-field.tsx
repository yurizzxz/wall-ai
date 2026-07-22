"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { CreateTransactionActionInput } from "@/actions/transactions/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";

const INSTALLMENT_OPTIONS = [
  ...Array.from({ length: 24 }, (_, index) => index + 1),
  30,
  36,
  48,
];

type TransactionInstallmentFieldProps = {
  form: UseFormReturn<CreateTransactionActionInput>;
};

export function TransactionInstallmentField({
  form,
}: TransactionInstallmentFieldProps) {
  const amountInCents = form.watch("amountInCents");
  const installmentCount = form.watch("installmentCount");

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">Parcelas</label>
      <Controller
        control={form.control}
        name="installmentCount"
        render={({ field }) => (
          <Select
            value={String(field.value)}
            onValueChange={(value) => field.onChange(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {field.value === 1 ? "1x à vista" : `${field.value}x`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {INSTALLMENT_OPTIONS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count === 1 ? "1x à vista" : `${count}x`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {amountInCents > 0 ? (
        <p className="text-xs text-muted-foreground">
          Primeira parcela de aproximadamente{" "}
          {formatCurrency(Math.ceil(amountInCents / installmentCount))}.
        </p>
      ) : null}
      {form.formState.errors.installmentCount?.message ? (
        <p className="text-xs text-destructive" role="alert">
          {form.formState.errors.installmentCount.message}
        </p>
      ) : null}
    </div>
  );
}
