"use client";

import { Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deactivateCreditCardAction } from "@/actions/credit-cards/deactivate-credit-card";
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

type DeactivateCreditCardDialogProps = {
  cardId: string;
  cardName: string;
};

export function DeactivateCreditCardDialog({
  cardId,
  cardName,
}: DeactivateCreditCardDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setError(undefined);
  }

  function handleDeactivate() {
    setError(undefined);

    startTransition(async () => {
      try {
        const result = await deactivateCreditCardAction({ creditCardId: cardId });

        if (!result?.data?.ok) {
          setError(result?.data?.message ?? "Não foi possível desativar o cartão.");
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        setError("Não foi possível desativar o cartão. Tente novamente.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={`Desativar ${cardName}`} />
        }
      >
        <Power aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar cartão?</DialogTitle>
          <DialogDescription>
            {cardName} deixará de aceitar novos lançamentos, mas o histórico será mantido.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Cartões com faturas ou compras comprometidas não podem ser desativados.
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeactivate}
            disabled={isPending}
          >
            {isPending ? "Desativando..." : "Desativar cartão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
