"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { createDebtAction } from "@/actions/debts/create-debt";
import { createDebtSchema, type CreateDebtActionInput } from "@/actions/debts/schema";
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

const DEFAULT_VALUES: CreateDebtActionInput = {
  creditor: "",
  description: "",
  totalInCents: 0,
  dueAt: undefined,
};

type FieldErrorProps = { id: string; message?: string };

function FieldError({ id, message }: FieldErrorProps) {
  return message ? (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

export function CreateDebtDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateDebtActionInput>({
    resolver: zodResolver(createDebtSchema) as Resolver<CreateDebtActionInput>,
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(DEFAULT_VALUES);
  }

  function onSubmit(input: CreateDebtActionInput) {
    form.clearErrors("root");
    startTransition(async () => {
      try {
        const result = await createDebtAction(input);
        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message: result?.data?.message ?? "Não foi possível criar a dívida.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível criar a dívida. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus aria-hidden="true" />
        Nova dívida
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Nova dívida</DialogTitle>
          <DialogDescription>
            Registre o compromisso para acompanhar os pagamentos e o saldo restante.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="debt-creditor" className="text-xs font-medium">Credor</label>
            <Input
              id="debt-creditor"
              autoComplete="off"
              placeholder="Ex.: Banco ou pessoa"
              aria-invalid={Boolean(form.formState.errors.creditor)}
              aria-describedby={form.formState.errors.creditor ? "debt-creditor-error" : undefined}
              {...form.register("creditor")}
            />
            <FieldError id="debt-creditor-error" message={form.formState.errors.creditor?.message} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="debt-description" className="text-xs font-medium">Descrição</label>
            <Input
              id="debt-description"
              autoComplete="off"
              placeholder="Ex.: Empréstimo pessoal"
              aria-invalid={Boolean(form.formState.errors.description)}
              aria-describedby={form.formState.errors.description ? "debt-description-error" : undefined}
              {...form.register("description")}
            />
            <FieldError id="debt-description-error" message={form.formState.errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="debt-total" className="text-xs font-medium">Valor total</label>
              <Input
                id="debt-total"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                aria-invalid={Boolean(form.formState.errors.totalInCents)}
                aria-describedby={form.formState.errors.totalInCents ? "debt-total-error" : undefined}
                {...form.register("totalInCents", {
                  setValueAs: (value: string) => Math.round(Number(value) * 100),
                })}
              />
              <FieldError id="debt-total-error" message={form.formState.errors.totalInCents?.message} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="debt-due-at" className="text-xs font-medium">
                Vencimento <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="debt-due-at"
                type="date"
                aria-invalid={Boolean(form.formState.errors.dueAt)}
                aria-describedby={form.formState.errors.dueAt ? "debt-due-at-error" : undefined}
                {...form.register("dueAt")}
              />
              <FieldError id="debt-due-at-error" message={form.formState.errors.dueAt?.message} />
            </div>
          </div>

          {form.formState.errors.root?.message ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar dívida"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
