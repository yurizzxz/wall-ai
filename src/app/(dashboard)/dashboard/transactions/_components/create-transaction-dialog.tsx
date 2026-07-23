"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type DefaultValues, type Resolver } from "react-hook-form";

import { createTransactionAction } from "@/actions/transactions/create-transaction";
import { createTransactionSchema, type CreateTransactionActionInput } from "@/actions/transactions/schema";
import {
  TransactionFormFields,
  type TransactionAccountOption,
  type TransactionCategoryOption,
  type TransactionCreditCardOption,
} from "@/app/(dashboard)/dashboard/transactions/_components/transaction-form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type CreateTransactionDialogProps = {
  accounts: TransactionAccountOption[];
  creditCards: TransactionCreditCardOption[];
  categories: TransactionCategoryOption[];
};

function createDefaultValues(accounts: TransactionAccountOption[], categories: TransactionCategoryOption[]): DefaultValues<CreateTransactionActionInput> {
  return {
    description: "",
    amountInCents: undefined,
    kind: "EXPENSE",
    status: "SETTLED",
    paymentMethod: "PIX",
    categoryId: categories.find((category) => category.kind !== "INCOME")?.id ?? "",
    accountId: accounts[0]?.id,
    creditCardId: undefined,
    dueAt: undefined,
    installmentCount: 1,
  };
}

export function CreateTransactionDialog({ accounts, creditCards, categories }: CreateTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const defaultValues = createDefaultValues(accounts, categories);
  const form = useForm<CreateTransactionActionInput>({
    resolver: zodResolver(createTransactionSchema) as Resolver<CreateTransactionActionInput>,
    defaultValues,
  });
  const kind = form.watch("kind");
  const paymentMethod = form.watch("paymentMethod");
  const hasCategory = categories.some((category) => category.kind === kind || category.kind === "BOTH");
  const hasSource = paymentMethod === "CREDIT_CARD" ? creditCards.length > 0 : accounts.length > 0;
  const canSubmit = hasCategory && hasSource;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(defaultValues);
  }

  function onSubmit(input: CreateTransactionActionInput) {
    form.clearErrors("root");
    startTransition(async () => {
      try {
        const result = await createTransactionAction(input);
        if (!result?.data?.ok) {
          form.setError("root", { type: "server", message: result?.data?.message ?? "Não foi possível criar o lançamento." });
          return;
        }
        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", { type: "server", message: "Não foi possível criar o lançamento. Tente novamente." });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" />}><Plus aria-hidden="true" />Novo lançamento</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-base">Novo lançamento</DialogTitle><DialogDescription>Registre uma receita ou despesa no seu histórico.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TransactionFormFields form={form} accounts={accounts} creditCards={creditCards} categories={categories} />
          {!canSubmit ? <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Cadastre uma categoria compatível e uma conta ou cartão ativo.</p> : null}
          {form.formState.errors.root?.message ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">{form.formState.errors.root.message}</p> : null}
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !canSubmit}>{isPending ? "Criando..." : "Criar lançamento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
