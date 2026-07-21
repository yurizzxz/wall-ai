"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { processRecurrenceAction } from "@/actions/recurrences/process-recurrence";
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

type ProcessRecurrenceDialogProps = {
  recurrenceId: string;
  description: string;
};

export function ProcessRecurrenceDialog({
  recurrenceId,
  description,
}: ProcessRecurrenceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setError(undefined);
  }

  function handleProcess() {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await processRecurrenceAction({ recurrenceId });
        if (!result?.data?.ok) {
          setError(result?.data?.message ?? "Não foi possível processar a recorrência.");
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        setError("Não foi possível processar a recorrência. Tente novamente.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Play aria-hidden="true" />
        Processar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Processar recorrência?</DialogTitle>
          <DialogDescription>
            Isso criará a movimentação de “{description}” e avançará a próxima ocorrência.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleProcess} disabled={isPending}>
            {isPending ? "Processando..." : "Confirmar processamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
