"use client";

import { Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deactivateAccountAction } from "@/actions/accounts/deactivate-account";
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

type DeactivateAccountDialogProps = {
  accountId: string;
  accountName: string;
};

export function DeactivateAccountDialog({
  accountId,
  accountName,
}: DeactivateAccountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(undefined);
    }
  }

  function handleDeactivate() {
    setError(undefined);

    startTransition(async () => {
      try {
        const result = await deactivateAccountAction({ accountId });

        if (!result?.data?.ok) {
          setError(result?.data?.message ?? "Não foi possível desativar a conta.");
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        setError("Não foi possível desativar a conta. Tente novamente.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Desativar ${accountName}`}
          />
        }
      >
        <Power aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar conta?</DialogTitle>
          <DialogDescription>
            {accountName} deixará de receber novos lançamentos, mas o histórico será mantido.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Contas com lançamentos pendentes não podem ser desativadas.
        </p>

        {error ? (
          <p
            className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
            role="alert"
          >
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
            {isPending ? "Desativando..." : "Desativar conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
