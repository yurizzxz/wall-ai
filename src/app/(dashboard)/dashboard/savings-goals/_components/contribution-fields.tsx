"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { ContributeToSavingsGoalActionInput } from "@/actions/savings-goals/schema";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";

export type AccountOption = {
  id: string;
  name: string;
  balanceInCents: number;
};

type ContributionFieldsProps = {
  goalId: string;
  accounts: AccountOption[];
  disabled: boolean;
  form: UseFormReturn<ContributeToSavingsGoalActionInput>;
};

type FieldErrorProps = {
  id: string;
  message?: string;
};

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function ContributionFields({
  goalId,
  accounts,
  disabled,
  form,
}: ContributionFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label
          htmlFor={`goal-amount-${goalId}`}
          className="text-xs font-medium"
        >
          Valor do aporte
        </label>
        <Input
          id={`goal-amount-${goalId}`}
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          disabled={disabled}
          aria-invalid={Boolean(form.formState.errors.amountInCents)}
          aria-describedby={
            form.formState.errors.amountInCents
              ? `goal-amount-error-${goalId}`
              : undefined
          }
          {...form.register("amountInCents", {
            setValueAs: (value: string) => Math.round(Number(value) * 100),
          })}
        />
        <FieldError
          id={`goal-amount-error-${goalId}`}
          message={form.formState.errors.amountInCents?.message}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`goal-account-${goalId}`}
          className="text-xs font-medium"
        >
          Conta de origem
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
                id={`goal-account-${goalId}`}
                className="w-full"
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.error ? `goal-account-error-${goalId}` : undefined
                }
              >
                <SelectValue>
                  {field.value
                    ? accounts.find((a) => a.id === field.value)?.name
                    : ""}
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
          id={`goal-account-error-${goalId}`}
          message={form.formState.errors.accountId?.message}
        />
      </div>

    </>
  );
}
