"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { closeInvoiceAction } from "@/actions/invoices/close-invoice";
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

type CloseInvoiceDialogProps = {
  invoiceId: string;
  cardName: string;
};

export function CloseInvoiceDialog({
  invoiceId,
  cardName,
}: CloseInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setError(undefined);
  }

  function handleCloseInvoice() {
    setError(undefined);

    startTransition(async () => {
      try {
        const result = await closeInvoiceAction({ invoiceId });

        if (!result?.data?.ok) {
          setError(result?.data?.message ?? "Não foi possível fechar a fatura.");
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        setError("Não foi possível fechar a fatura. Tente novamente.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <LockKeyhole aria-hidden="true" />
        Fechar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar fatura?</DialogTitle>
          <DialogDescription>
            As compras do período de {cardName} serão consolidadas para pagamento.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Depois do fechamento, novas compras serão direcionadas para a próxima fatura.
        </p>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleCloseInvoice} disabled={isPending}>
            {isPending ? "Fechando..." : "Fechar fatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
