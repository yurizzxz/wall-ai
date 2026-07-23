"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { PayInvoiceActionInput } from "@/actions/invoices/schema";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";

export type InvoiceAccountOption = {
  id: string;
  name: string;
  balanceInCents: number;
};

export type InvoiceCategoryOption = {
  id: string;
  name: string;
};

type InvoicePaymentFieldsProps = {
  invoiceId: string;
  outstandingInCents: number;
  accounts: InvoiceAccountOption[];
  categories: InvoiceCategoryOption[];
  disabled: boolean;
  form: UseFormReturn<PayInvoiceActionInput>;
};

type FieldErrorProps = { id: string; message?: string };

function FieldError({ id, message }: FieldErrorProps) {
  return message ? (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

export function InvoicePaymentFields({
  invoiceId,
  outstandingInCents,
  accounts,
  categories,
  disabled,
  form,
}: InvoicePaymentFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label
          htmlFor={`invoice-amount-${invoiceId}`}
          className="text-xs font-medium"
        >
          Valor do pagamento
        </label>
        <Input
          id={`invoice-amount-${invoiceId}`}
          type="number"
          inputMode="decimal"
          min="0.01"
          max={outstandingInCents / 100}
          step="0.01"
          placeholder={formatCurrency(outstandingInCents)}
          disabled={disabled}
          aria-invalid={Boolean(form.formState.errors.amountInCents)}
          aria-describedby={
            form.formState.errors.amountInCents
              ? `invoice-amount-error-${invoiceId}`
              : undefined
          }
          {...form.register("amountInCents", {
            setValueAs: (value: string) => Math.round(Number(value) * 100),
          })}
        />
        <FieldError
          id={`invoice-amount-error-${invoiceId}`}
          message={form.formState.errors.amountInCents?.message}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`invoice-account-${invoiceId}`}
          className="text-xs font-medium"
        >
          Conta de pagamento
        </label>
        <Controller
          control={form.control}
          name="accountId"
          render={({ field, fieldState }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={`invoice-account-${invoiceId}`}
                className="w-full"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.error
                    ? `invoice-account-error-${invoiceId}`
                    : undefined
                }
              >
                <SelectValue>
                  {field.value
                    ? accounts.find((account) => account.id === field.value)
                        ?.name
                    : "Selecione uma conta"}
                </SelectValue>
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
        <FieldError
          id={`invoice-account-error-${invoiceId}`}
          message={form.formState.errors.accountId?.message}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`invoice-method-${invoiceId}`}
          className="text-xs font-medium"
        >
          Forma de pagamento
        </label>
        <Controller
          control={form.control}
          name="paymentMethod"
          render={({ field, fieldState }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={`invoice-method-${invoiceId}`}
                className="w-full"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.error
                    ? `invoice-method-error-${invoiceId}`
                    : undefined
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">Pix</SelectItem>
                <SelectItem value="BANK_TRANSFER">
                  Transferência bancária
                </SelectItem>
                <SelectItem value="DEBIT_CARD">Cartão de débito</SelectItem>
                <SelectItem value="CASH">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError
          id={`invoice-method-error-${invoiceId}`}
          message={form.formState.errors.paymentMethod?.message}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`invoice-category-${invoiceId}`}
          className="text-xs font-medium"
        >
          Categoria
        </label>
        <Controller
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={`invoice-category-${invoiceId}`}
                className="w-full"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.error
                    ? `invoice-category-error-${invoiceId}`
                    : undefined
                }
              >
                <SelectValue>
                  {field.value
                    ? categories.find((category) => category.id === field.value)
                        ?.name
                    : "Selecione uma categoria"}
                </SelectValue>
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
        <FieldError
          id={`invoice-category-error-${invoiceId}`}
          message={form.formState.errors.categoryId?.message}
        />
      </div>
    </>
  );
}
