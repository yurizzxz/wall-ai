"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { contributeToSavingsGoalAction } from "@/actions/savings-goals/contribute-to-savings-goal";
import {
  contributeToSavingsGoalSchema,
  type ContributeToSavingsGoalActionInput,
} from "@/actions/savings-goals/schema";
import {
  ContributionFields,
  type AccountOption,
  type CategoryOption,
} from "@/app/(dashboard)/dashboard/savings-goals/_components/contribution-fields";
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

type ContributeToSavingsGoalDialogProps = {
  goalId: string;
  goalName: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function ContributeToSavingsGoalDialog({
  goalId,
  goalName,
  accounts,
  categories,
}: ContributeToSavingsGoalDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasRequiredOptions = accounts.length > 0 && categories.length > 0;
  const defaultValues: ContributeToSavingsGoalActionInput = {
    savingsGoalId: goalId,
    accountId: accounts[0]?.id ?? "",
    categoryId: categories[0]?.id ?? "",
    amountInCents: 0,
  };
  const form = useForm<ContributeToSavingsGoalActionInput>({
    resolver: zodResolver(contributeToSavingsGoalSchema) as Resolver<ContributeToSavingsGoalActionInput>,
    defaultValues,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(defaultValues);
  }

  function onSubmit(input: ContributeToSavingsGoalActionInput) {
    form.clearErrors("root");

    startTransition(async () => {
      try {
        const result = await contributeToSavingsGoalAction(input);

        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message:
              result?.data?.message ??
              "Não foi possível registrar o aporte. Revise os dados e tente novamente.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível registrar o aporte. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus aria-hidden="true" />
        Aporte
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Adicionar aporte</DialogTitle>
          <DialogDescription>
            O valor será retirado de uma conta e adicionado à meta {goalName}.
          </DialogDescription>
        </DialogHeader>

        {!hasRequiredOptions ? (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground" role="status">
            Para aportar, você precisa de uma conta ativa e uma categoria de despesa ativa.
          </p>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ContributionFields
            goalId={goalId}
            accounts={accounts}
            categories={categories}
            disabled={!hasRequiredOptions}
            form={form}
          />

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
            <Button type="submit" disabled={isPending || !hasRequiredOptions}>
              {isPending ? "Adicionando..." : "Adicionar aporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
