"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { PayDebtActionInput } from "@/actions/debts/schema";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";

export type DebtAccountOption = {
  id: string;
  name: string;
  balanceInCents: number;
};

export type DebtCategoryOption = { id: string; name: string };

type DebtPaymentFieldsProps = {
  debtId: string;
  outstandingInCents: number;
  accounts: DebtAccountOption[];
  categories: DebtCategoryOption[];
  disabled: boolean;
  form: UseFormReturn<PayDebtActionInput>;
};

type FieldErrorProps = { id: string; message?: string };

function FieldError({ id, message }: FieldErrorProps) {
  return message ? (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

export function DebtPaymentFields({
  debtId,
  outstandingInCents,
  accounts,
  categories,
  disabled,
  form,
}: DebtPaymentFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor={`debt-payment-${debtId}`} className="text-xs font-medium">
          Valor do pagamento
        </label>
        <Input
          id={`debt-payment-${debtId}`}
          type="number"
          inputMode="decimal"
          min="0.01"
          max={outstandingInCents / 100}
          step="0.01"
          placeholder={formatCurrency(outstandingInCents)}
          disabled={disabled}
          aria-invalid={Boolean(form.formState.errors.amountInCents)}
          aria-describedby={form.formState.errors.amountInCents ? `debt-payment-error-${debtId}` : undefined}
          {...form.register("amountInCents", {
            setValueAs: (value: string) => Math.round(Number(value) * 100),
          })}
        />
        <FieldError id={`debt-payment-error-${debtId}`} message={form.formState.errors.amountInCents?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`debt-account-${debtId}`} className="text-xs font-medium">
          Conta de pagamento
        </label>
        <Controller
          control={form.control}
          name="accountId"
          render={({ field, fieldState }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger
                id={`debt-account-${debtId}`}
                className="w-full"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `debt-account-error-${debtId}` : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} · {formatCurrency(account.balanceInCents)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError id={`debt-account-error-${debtId}`} message={form.formState.errors.accountId?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`debt-method-${debtId}`} className="text-xs font-medium">
          Forma de pagamento
        </label>
        <Controller
          control={form.control}
          name="paymentMethod"
          render={({ field, fieldState }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger
                id={`debt-method-${debtId}`}
                className="w-full"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `debt-method-error-${debtId}` : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">Pix</SelectItem>
                <SelectItem value="BANK_TRANSFER">Transferência bancária</SelectItem>
                <SelectItem value="DEBIT_CARD">Cartão de débito</SelectItem>
                <SelectItem value="CASH">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError id={`debt-method-error-${debtId}`} message={form.formState.errors.paymentMethod?.message} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`debt-category-${debtId}`} className="text-xs font-medium">
          Categoria
        </label>
        <Controller
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger
                id={`debt-category-${debtId}`}
                className="w-full"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `debt-category-error-${debtId}` : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError id={`debt-category-error-${debtId}`} message={form.formState.errors.categoryId?.message} />
      </div>
    </>
  );
}
