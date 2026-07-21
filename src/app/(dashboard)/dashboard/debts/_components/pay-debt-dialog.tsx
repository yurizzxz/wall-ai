"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HandCoins } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { payDebtAction } from "@/actions/debts/pay-debt";
import { payDebtSchema, type PayDebtActionInput } from "@/actions/debts/schema";
import {
  DebtPaymentFields,
  type DebtAccountOption,
  type DebtCategoryOption,
} from "@/app/(dashboard)/dashboard/debts/_components/debt-payment-fields";
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

type PayDebtDialogProps = {
  debtId: string;
  creditor: string;
  outstandingInCents: number;
  accounts: DebtAccountOption[];
  categories: DebtCategoryOption[];
};

export function PayDebtDialog({
  debtId,
  creditor,
  outstandingInCents,
  accounts,
  categories,
}: PayDebtDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasRequiredOptions = accounts.length > 0 && categories.length > 0;
  const defaultValues: PayDebtActionInput = {
    debtId,
    accountId: accounts[0]?.id ?? "",
    categoryId: categories[0]?.id ?? "",
    amountInCents: 0,
    paymentMethod: "PIX",
  };
  const form = useForm<PayDebtActionInput>({
    resolver: zodResolver(payDebtSchema) as Resolver<PayDebtActionInput>,
    defaultValues,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(defaultValues);
  }

  function onSubmit(input: PayDebtActionInput) {
    form.clearErrors("root");
    startTransition(async () => {
      try {
        const result = await payDebtAction(input);
        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message: result?.data?.message ?? "Não foi possível pagar a dívida.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível pagar a dívida. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <HandCoins aria-hidden="true" />
        Pagar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Pagar dívida</DialogTitle>
          <DialogDescription>
            Registre um pagamento integral ou parcial para {creditor}.
          </DialogDescription>
        </DialogHeader>

        {!hasRequiredOptions ? (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground" role="status">
            Para pagar, você precisa de uma conta ativa e uma categoria de despesa ativa.
          </p>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DebtPaymentFields
            debtId={debtId}
            outstandingInCents={outstandingInCents}
            accounts={accounts}
            categories={categories}
            disabled={!hasRequiredOptions}
            form={form}
          />

          {form.formState.errors.root?.message ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !hasRequiredOptions}>
              {isPending ? "Pagando..." : "Registrar pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
