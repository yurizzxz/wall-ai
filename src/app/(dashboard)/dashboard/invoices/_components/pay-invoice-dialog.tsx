"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { payInvoiceAction } from "@/actions/invoices/pay-invoice";
import { payInvoiceSchema, type PayInvoiceActionInput } from "@/actions/invoices/schema";
import {
  InvoicePaymentFields,
  type InvoiceAccountOption,
  type InvoiceCategoryOption,
} from "@/app/(dashboard)/dashboard/invoices/_components/invoice-payment-fields";
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

type PayInvoiceDialogProps = {
  invoiceId: string;
  cardName: string;
  outstandingInCents: number;
  accounts: InvoiceAccountOption[];
  categories: InvoiceCategoryOption[];
};

export function PayInvoiceDialog({
  invoiceId,
  cardName,
  outstandingInCents,
  accounts,
  categories,
}: PayInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasRequiredOptions = accounts.length > 0 && categories.length > 0;
  const defaultValues: PayInvoiceActionInput = {
    invoiceId,
    accountId: accounts[0]?.id ?? "",
    categoryId: categories[0]?.id ?? "",
    amountInCents: 0,
    paymentMethod: "PIX",
  };
  const form = useForm<PayInvoiceActionInput>({
    resolver: zodResolver(payInvoiceSchema) as Resolver<PayInvoiceActionInput>,
    defaultValues,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(defaultValues);
  }

  function onSubmit(input: PayInvoiceActionInput) {
    form.clearErrors("root");
    startTransition(async () => {
      try {
        const result = await payInvoiceAction(input);
        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message: result?.data?.message ?? "Não foi possível pagar a fatura.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível pagar a fatura. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <CircleDollarSign aria-hidden="true" />
        Pagar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Pagar fatura</DialogTitle>
          <DialogDescription>
            Registre um pagamento integral ou parcial da fatura de {cardName}.
          </DialogDescription>
        </DialogHeader>

        {!hasRequiredOptions ? (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground" role="status">
            Para pagar, você precisa de uma conta ativa e uma categoria de despesa ativa.
          </p>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <InvoicePaymentFields
            invoiceId={invoiceId}
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
