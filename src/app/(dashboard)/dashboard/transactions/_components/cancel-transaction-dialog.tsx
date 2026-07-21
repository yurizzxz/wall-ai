"use client";

import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelTransactionAction } from "@/actions/transactions/cancel-transaction";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type CancelTransactionDialogProps = {
  transactionId: string;
  description: string;
};

export function CancelTransactionDialog({ transactionId, description }: CancelTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setError(undefined);
  }

  function handleCancel() {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await cancelTransactionAction({ transactionId });
        if (!result?.data?.ok) {
          setError(result?.data?.message ?? "Não foi possível cancelar o lançamento.");
          return;
        }
        handleOpenChange(false);
        router.refresh();
      } catch {
        setError("Não foi possível cancelar o lançamento. Tente novamente.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}><Ban aria-hidden="true" />Cancelar</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-base">Cancelar lançamento?</DialogTitle><DialogDescription>“{description}” será marcado como cancelado e deixará de compor os cálculos aplicáveis. Essa ação não pode ser desfeita aqui.</DialogDescription></DialogHeader>
        {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">{error}</p> : null}
        <DialogFooter><Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>Voltar</Button><Button variant="destructive" onClick={handleCancel} disabled={isPending}>{isPending ? "Cancelando..." : "Cancelar lançamento"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
