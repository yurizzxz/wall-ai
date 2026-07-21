"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { createRecurrenceAction } from "@/actions/recurrences/create-recurrence";
import {
  createRecurrenceSchema,
  type CreateRecurrenceActionInput,
} from "@/actions/recurrences/schema";
import {
  RecurrenceFormFields,
  type RecurrenceAccountOption,
  type RecurrenceCategoryOption,
  type RecurrenceCreditCardOption,
} from "@/app/(dashboard)/dashboard/recurrences/_components/recurrence-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CreateRecurrenceDialogProps = {
  accounts: RecurrenceAccountOption[];
  creditCards: RecurrenceCreditCardOption[];
  categories: RecurrenceCategoryOption[];
};

function createDefaultValues(
  accounts: RecurrenceAccountOption[],
  categories: RecurrenceCategoryOption[],
): CreateRecurrenceActionInput {
  return {
    accountId: accounts[0]?.id,
    categoryId:
      categories.find((category) => category.kind !== "INCOME")?.id ?? "",
    creditCardId: undefined,
    description: "",
    amountInCents: 0,
    kind: "EXPENSE",
    paymentMethod: "PIX",
    frequency: "MONTHLY",
    nextOccurrenceAt: new Date(),
    endsAt: undefined,
  };
}

export function CreateRecurrenceDialog({
  accounts,
  creditCards,
  categories,
}: CreateRecurrenceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const defaultValues = createDefaultValues(accounts, categories);
  const form = useForm<CreateRecurrenceActionInput>({
    resolver: zodResolver(createRecurrenceSchema) as Resolver<CreateRecurrenceActionInput>,
    defaultValues,
  });
  const selectedKind = form.watch("kind");
  const selectedPaymentMethod = form.watch("paymentMethod");
  const hasCompatibleCategory = categories.some(
    (category) => category.kind === selectedKind || category.kind === "BOTH",
  );
  const hasSource =
    selectedPaymentMethod === "CREDIT_CARD"
      ? creditCards.length > 0
      : accounts.length > 0;
  const canSubmit = hasCompatibleCategory && hasSource;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(defaultValues);
  }

  function onSubmit(input: CreateRecurrenceActionInput) {
    form.clearErrors("root");
    startTransition(async () => {
      try {
        const result = await createRecurrenceAction(input);
        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message: result?.data?.message ?? "Não foi possível criar a recorrência.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível criar a recorrência. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus aria-hidden="true" />
        Nova recorrência
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Nova recorrência</DialogTitle>
          <DialogDescription>
            Defina quando e de onde a movimentação será lançada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <RecurrenceFormFields
            form={form}
            accounts={accounts}
            creditCards={creditCards}
            categories={categories}
          />

          {!canSubmit ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Cadastre uma categoria compatível e uma conta ou cartão ativo para criar a
              recorrência.
            </p>
          ) : null}

          {form.formState.errors.root?.message ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Criando..." : "Criar recorrência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
