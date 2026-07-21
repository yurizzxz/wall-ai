"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { CreateRecurrenceActionInput } from "@/actions/recurrences/schema";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FREQUENCY_LABELS,
  KIND_LABELS,
  PAYMENT_METHODS,
} from "@/lib/formatters";

export type RecurrenceAccountOption = { id: string; name: string };
export type RecurrenceCreditCardOption = { id: string; name: string };
export type RecurrenceCategoryOption = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE" | "BOTH";
};

type RecurrenceFormFieldsProps = {
  form: UseFormReturn<CreateRecurrenceActionInput>;
  accounts: RecurrenceAccountOption[];
  creditCards: RecurrenceCreditCardOption[];
  categories: RecurrenceCategoryOption[];
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

function toDateInputValue(value?: Date) {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : "";
}

function fromDateInputValue(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

function fromEndDateInputValue(value: string) {
  return value ? new Date(`${value}T23:59:59.999Z`) : undefined;
}

export function RecurrenceFormFields({
  form,
  accounts,
  creditCards,
  categories,
}: RecurrenceFormFieldsProps) {
  const kind = form.watch("kind");
  const paymentMethod = form.watch("paymentMethod");
  const compatibleCategories = categories.filter(
    (category) => category.kind === kind || category.kind === "BOTH",
  );

  function changeKind(nextKind: "INCOME" | "EXPENSE") {
    form.setValue("kind", nextKind, { shouldValidate: true });
    const nextCompatibleCategories = categories.filter(
      (category) => category.kind === nextKind || category.kind === "BOTH",
    );
    const selected = nextCompatibleCategories.find(
      (category) => category.id === form.getValues("categoryId"),
    );
    if (!selected) {
      const nextCategory = nextCompatibleCategories[0];
      form.setValue("categoryId", nextCategory?.id ?? "", {
        shouldValidate: true,
      });
    }
  }

  function changePaymentMethod(
    nextMethod: CreateRecurrenceActionInput["paymentMethod"],
  ) {
    form.setValue("paymentMethod", nextMethod, { shouldValidate: true });
    if (nextMethod === "CREDIT_CARD") {
      changeKind("EXPENSE");
      form.setValue("accountId", undefined);
      form.setValue("creditCardId", creditCards[0]?.id, {
        shouldValidate: true,
      });
      return;
    }
    form.setValue("creditCardId", undefined);
    form.setValue("accountId", accounts[0]?.id, { shouldValidate: true });
  }

  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="recurrence-description" className="text-xs font-medium">
          Descrição
        </label>
        <Input
          id="recurrence-description"
          placeholder="Ex.: Assinatura mensal"
          autoComplete="off"
          {...form.register("description")}
        />
        <FieldError message={form.formState.errors.description?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="recurrence-amount" className="text-xs font-medium">
            Valor
          </label>
          <Input
            id="recurrence-amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            {...form.register("amountInCents", {
              setValueAs: (value: string) => Math.round(Number(value) * 100),
            })}
          />
          <FieldError message={form.formState.errors.amountInCents?.message} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Tipo</label>
          <Controller
            control={form.control}
            name="kind"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  changeKind(value as "INCOME" | "EXPENSE")
                }
                disabled={paymentMethod === "CREDIT_CARD"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{KIND_LABELS[field.value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Categoria</label>
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {
                      categories.find((category) => category.id === field.value)
                        ?.name
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {compatibleCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={form.formState.errors.categoryId?.message} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Forma de pagamento</label>
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  changePaymentMethod(
                    value as CreateRecurrenceActionInput["paymentMethod"],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">
          {paymentMethod === "CREDIT_CARD" ? "Cartão" : "Conta"}
        </label>
        <Controller
          control={form.control}
          name={paymentMethod === "CREDIT_CARD" ? "creditCardId" : "accountId"}
          render={({ field }) => {
            const options =
              paymentMethod === "CREDIT_CARD" ? creditCards : accounts;
            return (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {options.find((option) => option.id === field.value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
        <FieldError
          message={
            paymentMethod === "CREDIT_CARD"
              ? form.formState.errors.creditCardId?.message
              : form.formState.errors.accountId?.message
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Frequência</label>
          <Controller
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>{FREQUENCY_LABELS[field.value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="recurrence-next" className="text-xs font-medium">
            Próxima ocorrência
          </label>
          <Controller
            control={form.control}
            name="nextOccurrenceAt"
            render={({ field }) => (
              <Input
                id="recurrence-next"
                type="date"
                value={toDateInputValue(field.value)}
                onChange={(event) =>
                  field.onChange(fromDateInputValue(event.target.value))
                }
              />
            )}
          />
          <FieldError
            message={form.formState.errors.nextOccurrenceAt?.message}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="recurrence-end" className="text-xs font-medium">
            Término{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <Controller
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <Input
                id="recurrence-end"
                type="date"
                value={toDateInputValue(field.value)}
                onChange={(event) =>
                  field.onChange(fromEndDateInputValue(event.target.value))
                }
              />
            )}
          />
          <FieldError message={form.formState.errors.endsAt?.message} />
        </div>
      </div>
    </>
  );
}
