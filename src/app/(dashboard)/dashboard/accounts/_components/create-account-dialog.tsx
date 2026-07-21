"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { createAccountAction } from "@/actions/accounts/create-account";
import {
  createAccountSchema,
  type CreateAccountActionInput,
} from "@/actions/accounts/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_TYPE_LABELS } from "@/lib/formatters";

const DEFAULT_VALUES: CreateAccountActionInput = {
  name: "",
  type: "CHECKING",
  initialBalanceInCents: 0,
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

export function CreateAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateAccountActionInput>({
    resolver: zodResolver(
      createAccountSchema,
    ) as Resolver<CreateAccountActionInput>,
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
    }
  }

  function onSubmit(input: CreateAccountActionInput) {
    form.clearErrors("root");

    startTransition(async () => {
      try {
        const result = await createAccountAction(input);

        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message:
              result?.data?.message ??
              "Não foi possível criar a conta. Revise os dados e tente novamente.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível criar a conta. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus aria-hidden="true" />
        Nova conta
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Nova conta</DialogTitle>
          <DialogDescription>
            Cadastre onde você mantém dinheiro para acompanhar o saldo real.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="account-name" className="text-xs font-medium">
              Nome
            </label>
            <Input
              id="account-name"
              autoComplete="off"
              placeholder="Ex.: Conta principal"
              aria-invalid={Boolean(form.formState.errors.name)}
              aria-describedby={
                form.formState.errors.name ? "account-name-error" : undefined
              }
              {...form.register("name")}
            />
            <FieldError
              id="account-name-error"
              message={form.formState.errors.name?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="account-type" className="text-xs font-medium">
              Tipo de conta
            </label>
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="account-type"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.error ? "account-type-error" : undefined
                    }
                  >
                    <SelectValue>
                      {ACCOUNT_TYPE_LABELS[field.value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHECKING">Conta corrente</SelectItem>
                    <SelectItem value="SAVINGS">Poupança</SelectItem>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                    <SelectItem value="INVESTMENT">Investimentos</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError
              id="account-type-error"
              message={form.formState.errors.type?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="account-balance" className="text-xs font-medium">
              Saldo inicial
            </label>
            <Input
              id="account-balance"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0,00"
              aria-invalid={Boolean(
                form.formState.errors.initialBalanceInCents,
              )}
              aria-describedby={
                form.formState.errors.initialBalanceInCents
                  ? "account-balance-error"
                  : "account-balance-hint"
              }
              {...form.register("initialBalanceInCents", {
                setValueAs: (value: string) => Math.round(Number(value) * 100),
              })}
            />
            <p
              id="account-balance-hint"
              className="text-xs text-muted-foreground"
            >
              Informe o valor atual disponível nessa conta.
            </p>
            <FieldError
              id="account-balance-error"
              message={form.formState.errors.initialBalanceInCents?.message}
            />
          </div>

          {form.formState.errors.root?.message ? (
            <p
              className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
              role="alert"
            >
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
              {isPending ? "Criando..." : "Criar conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
