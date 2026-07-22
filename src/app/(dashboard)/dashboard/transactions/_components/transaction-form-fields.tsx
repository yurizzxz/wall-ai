"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { CreateTransactionActionInput } from "@/actions/transactions/schema";
import { TransactionInstallmentField } from "@/app/(dashboard)/dashboard/transactions/_components/transaction-installment-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  TRANSACTION_STATUS_LABELS,
} from "@/lib/formatters";

export type TransactionAccountOption = {
  id: string;
  name: string;
  balanceInCents: number;
};
export type TransactionCreditCardOption = {
  id: string;
  name: string;
  availableInCents: number;
};
export type TransactionCategoryOption = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE" | "BOTH";
};

type TransactionFormFieldsProps = {
  form: UseFormReturn<CreateTransactionActionInput>;
  accounts: TransactionAccountOption[];
  creditCards: TransactionCreditCardOption[];
  categories: TransactionCategoryOption[];
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

export function TransactionFormFields({
  form,
  accounts,
  creditCards,
  categories,
}: TransactionFormFieldsProps) {
  const kind = form.watch("kind");
  const paymentMethod = form.watch("paymentMethod");
  const compatibleCategories = categories.filter(
    (category) => category.kind === kind || category.kind === "BOTH",
  );

  function changeKind(nextKind: CreateTransactionActionInput["kind"]) {
    form.setValue("kind", nextKind, { shouldValidate: true });
    const nextCategories = categories.filter(
      (category) => category.kind === nextKind || category.kind === "BOTH",
    );
    if (
      !nextCategories.some(
        (category) => category.id === form.getValues("categoryId"),
      )
    ) {
      form.setValue("categoryId", nextCategories[0]?.id ?? "", {
        shouldValidate: true,
      });
    }
  }

  function changePaymentMethod(
    nextMethod: CreateTransactionActionInput["paymentMethod"],
  ) {
    form.setValue("paymentMethod", nextMethod, { shouldValidate: true });
    if (nextMethod === "CREDIT_CARD") {
      changeKind("EXPENSE");
      form.setValue("accountId", undefined);
      form.setValue("dueAt", undefined);
      form.setValue("creditCardId", creditCards[0]?.id, {
        shouldValidate: true,
      });
      form.setValue("installmentCount", 1, { shouldValidate: true });
      return;
    }
    form.setValue("creditCardId", undefined);
    form.setValue("accountId", accounts[0]?.id, { shouldValidate: true });
    form.setValue("installmentCount", 1, { shouldValidate: true });
  }

  return (
    <>
      <div className="space-y-1.5">
        <label
          htmlFor="transaction-description"
          className="text-xs font-medium"
        >
          Descrição
        </label>
        <Input
          id="transaction-description"
          autoComplete="off"
          placeholder="Ex.: Compra no mercado"
          {...form.register("description")}
        />
        <FieldError message={form.formState.errors.description?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="transaction-amount" className="text-xs font-medium">
            Valor
          </label>
          <Input
            id="transaction-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
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
                  changeKind(value as CreateTransactionActionInput["kind"])
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
          <label className="text-xs font-medium">Status</label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {TRANSACTION_STATUS_LABELS[field.value]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SETTLED">Liquidado</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Categoria</label>
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {compatibleCategories.find(
                      (category) => category.id === field.value,
                    )?.name ?? "Selecione"}
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
                  value as CreateTransactionActionInput["paymentMethod"],
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>{PAYMENT_METHOD_LABELS[field.value]}</SelectValue>
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
            const selectedName = options.find(
              (option) => option.id === field.value,
            )?.name;
            return (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>{selectedName ?? "Selecione"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name} ·{" "}
                      {formatCurrency(
                        "availableInCents" in option
                          ? option.availableInCents
                          : option.balanceInCents,
                      )}
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

      {paymentMethod === "CREDIT_CARD" ? (
        <TransactionInstallmentField form={form} />
      ) : null}

      <div
        className={
          paymentMethod === "CREDIT_CARD"
            ? "grid gap-4"
            : "grid gap-4 sm:grid-cols-2"
        }
      >
        <div className="space-y-1.5">
          <label htmlFor="transaction-occurred" className="text-xs font-medium">
            Data do lançamento
          </label>
          <Input
            id="transaction-occurred"
            type="date"
            {...form.register("occurredAt")}
          />
          <FieldError message={form.formState.errors.occurredAt?.message} />
        </div>
        {paymentMethod !== "CREDIT_CARD" ? (
          <div className="space-y-1.5">
            <label htmlFor="transaction-due" className="text-xs font-medium">
              Vencimento{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <Input
              id="transaction-due"
              type="date"
              {...form.register("dueAt")}
            />
            <FieldError message={form.formState.errors.dueAt?.message} />
          </div>
        ) : null}
      </div>
    </>
  );
}
