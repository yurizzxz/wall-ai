"use client";

import { Pause } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deactivateRecurrenceAction } from "@/actions/recurrences/deactivate-recurrence";
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

type DeactivateRecurrenceDialogProps = {
  recurrenceId: string;
  description: string;
};

export function DeactivateRecurrenceDialog({
  recurrenceId,
  description,
}: DeactivateRecurrenceDialogProps) {
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
        const result = await deactivateRecurrenceAction({ recurrenceId });
        if (!result?.data?.ok) {
          setError(result?.data?.message ?? "Não foi possível desativar a recorrência.");
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        setError("Não foi possível desativar a recorrência. Tente novamente.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Pause aria-hidden="true" />
        Desativar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Desativar recorrência?</DialogTitle>
          <DialogDescription>
            “{description}” não gerará novos lançamentos. Registros anteriores permanecem.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={handleDeactivate} disabled={isPending}>
            {isPending ? "Desativando..." : "Desativar recorrência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
