"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { createSavingsGoalAction } from "@/actions/savings-goals/create-savings-goal";
import {
  createSavingsGoalSchema,
  type CreateSavingsGoalActionInput,
} from "@/actions/savings-goals/schema";
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
import { Input } from "@/components/ui/input";

const DEFAULT_VALUES: CreateSavingsGoalActionInput = {
  name: "",
  targetInCents: 0,
  deadline: undefined,
};

type FieldErrorProps = {
  id: string;
  message?: string;
};

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function CreateSavingsGoalDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateSavingsGoalActionInput>({
    resolver: zodResolver(createSavingsGoalSchema) as Resolver<CreateSavingsGoalActionInput>,
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(DEFAULT_VALUES);
  }

  function onSubmit(input: CreateSavingsGoalActionInput) {
    form.clearErrors("root");

    startTransition(async () => {
      try {
        const result = await createSavingsGoalAction(input);

        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message:
              result?.data?.message ??
              "Não foi possível criar a meta. Revise os dados e tente novamente.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível criar a meta. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus aria-hidden="true" />
        Nova meta
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Nova meta</DialogTitle>
          <DialogDescription>
            Defina quanto deseja guardar e, se quiser, uma data para chegar lá.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="goal-name" className="text-xs font-medium">
              Nome
            </label>
            <Input
              id="goal-name"
              autoComplete="off"
              placeholder="Ex.: Reserva de emergência"
              aria-invalid={Boolean(form.formState.errors.name)}
              aria-describedby={form.formState.errors.name ? "goal-name-error" : undefined}
              {...form.register("name")}
            />
            <FieldError id="goal-name-error" message={form.formState.errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="goal-target" className="text-xs font-medium">
              Valor da meta
            </label>
            <Input
              id="goal-target"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              aria-invalid={Boolean(form.formState.errors.targetInCents)}
              aria-describedby={form.formState.errors.targetInCents ? "goal-target-error" : undefined}
              {...form.register("targetInCents", {
                setValueAs: (value: string) => Math.round(Number(value) * 100),
              })}
            />
            <FieldError
              id="goal-target-error"
              message={form.formState.errors.targetInCents?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="goal-deadline" className="text-xs font-medium">
              Prazo <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="goal-deadline"
              type="date"
              aria-invalid={Boolean(form.formState.errors.deadline)}
              aria-describedby={form.formState.errors.deadline ? "goal-deadline-error" : undefined}
              {...form.register("deadline")}
            />
            <FieldError id="goal-deadline-error" message={form.formState.errors.deadline?.message} />
          </div>

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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
