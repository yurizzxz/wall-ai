"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { createCreditCardAction } from "@/actions/credit-cards/create-credit-card";
import {
  createCreditCardSchema,
  type CreateCreditCardActionInput,
} from "@/actions/credit-cards/schema";
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

const DEFAULT_VALUES: CreateCreditCardActionInput = {
  name: "",
  lastFour: undefined,
  limitInCents: 0,
  closingDay: 1,
  dueDay: 10,
};

type FieldErrorProps = {
  id: string;
  message?: string;
};

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function CreateCreditCardDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateCreditCardActionInput>({
    resolver: zodResolver(createCreditCardSchema) as Resolver<CreateCreditCardActionInput>,
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
    }
  }

  function onSubmit(input: CreateCreditCardActionInput) {
    form.clearErrors("root");

    startTransition(async () => {
      try {
        const result = await createCreditCardAction(input);

        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message:
              result?.data?.message ??
              "Não foi possível criar o cartão. Revise os dados e tente novamente.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível criar o cartão. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus aria-hidden="true" />
        Novo cartão
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Novo cartão</DialogTitle>
          <DialogDescription>
            Informe o limite e as datas usadas para organizar suas faturas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <div className="space-y-1.5">
              <label htmlFor="card-name" className="text-xs font-medium">
                Nome
              </label>
              <Input
                id="card-name"
                autoComplete="off"
                placeholder="Ex.: Cartão principal"
                aria-invalid={Boolean(form.formState.errors.name)}
                aria-describedby={form.formState.errors.name ? "card-name-error" : undefined}
                {...form.register("name")}
              />
              <FieldError id="card-name-error" message={form.formState.errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="card-last-four" className="text-xs font-medium">
                Final <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="card-last-four"
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={4}
                placeholder="1234"
                aria-invalid={Boolean(form.formState.errors.lastFour)}
                aria-describedby={form.formState.errors.lastFour ? "card-last-four-error" : undefined}
                {...form.register("lastFour")}
              />
              <FieldError
                id="card-last-four-error"
                message={form.formState.errors.lastFour?.message}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="card-limit" className="text-xs font-medium">
              Limite total
            </label>
            <Input
              id="card-limit"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              aria-invalid={Boolean(form.formState.errors.limitInCents)}
              aria-describedby={form.formState.errors.limitInCents ? "card-limit-error" : undefined}
              {...form.register("limitInCents", {
                setValueAs: (value: string) => Math.round(Number(value) * 100),
              })}
            />
            <FieldError id="card-limit-error" message={form.formState.errors.limitInCents?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="card-closing-day" className="text-xs font-medium">
                Dia de fechamento
              </label>
              <Input
                id="card-closing-day"
                type="number"
                inputMode="numeric"
                min="1"
                max="28"
                aria-invalid={Boolean(form.formState.errors.closingDay)}
                aria-describedby={form.formState.errors.closingDay ? "card-closing-error" : undefined}
                {...form.register("closingDay")}
              />
              <FieldError id="card-closing-error" message={form.formState.errors.closingDay?.message} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="card-due-day" className="text-xs font-medium">
                Dia de vencimento
              </label>
              <Input
                id="card-due-day"
                type="number"
                inputMode="numeric"
                min="1"
                max="28"
                aria-invalid={Boolean(form.formState.errors.dueDay)}
                aria-describedby={form.formState.errors.dueDay ? "card-due-error" : undefined}
                {...form.register("dueDay")}
              />
              <FieldError id="card-due-error" message={form.formState.errors.dueDay?.message} />
            </div>
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
              {isPending ? "Criando..." : "Criar cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
