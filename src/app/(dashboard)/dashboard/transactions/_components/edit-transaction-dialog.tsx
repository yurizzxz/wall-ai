"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";

import { updateTransactionAction } from "@/actions/transactions/update-transaction";
import { updateTransactionSchema } from "@/actions/transactions/schema";
import type { TransactionCategoryOption } from "@/app/(dashboard)/dashboard/transactions/_components/transaction-form-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TransactionListItem } from "@/modules/transactions/application/list-transactions";

type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

type EditTransactionDialogProps = {
  transaction: TransactionListItem;
  categories: TransactionCategoryOption[];
};

export function EditTransactionDialog({ transaction, categories }: EditTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const compatibleCategories = categories.filter(
    (category) => category.kind === transaction.kind || category.kind === "BOTH",
  );
  const currentCategoryId = transaction.categoryId;
  const defaultValues: UpdateTransactionInput = {
    transactionId: transaction.id,
    description: transaction.description,
    categoryId: currentCategoryId && compatibleCategories.some((category) => category.id === currentCategoryId)
      ? currentCategoryId
      : compatibleCategories[0]?.id ?? "",
  };
  const form = useForm<UpdateTransactionInput>({
    resolver: zodResolver(updateTransactionSchema) as Resolver<UpdateTransactionInput>,
    defaultValues,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset(defaultValues);
  }

  function onSubmit(input: UpdateTransactionInput) {
    form.clearErrors("root");
    startTransition(async () => {
      try {
        const result = await updateTransactionAction(input);
        if (!result?.data?.ok) {
          form.setError("root", { type: "server", message: result?.data?.message ?? "Não foi possível editar o lançamento." });
          return;
        }
        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", { type: "server", message: "Não foi possível editar o lançamento. Tente novamente." });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Pencil aria-hidden="true" />Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-base">Editar lançamento</DialogTitle><DialogDescription>Altere a descrição ou a categoria do registro.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={`transaction-edit-description-${transaction.id}`} className="text-xs font-medium">Descrição</label>
            <Input id={`transaction-edit-description-${transaction.id}`} {...form.register("description")} />
            {form.formState.errors.description?.message ? <p className="text-xs text-destructive" role="alert">{form.formState.errors.description.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Categoria</label>
            <Controller control={form.control} name="categoryId" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={compatibleCategories.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {compatibleCategories.find((category) => category.id === field.value)?.name ?? "Selecione"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>{compatibleCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {form.formState.errors.categoryId?.message ? <p className="text-xs text-destructive" role="alert">{form.formState.errors.categoryId.message}</p> : null}
          </div>
          {compatibleCategories.length === 0 ? <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Cadastre uma categoria ativa compatível antes de editar.</p> : null}
          {form.formState.errors.root?.message ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">{form.formState.errors.root.message}</p> : null}
          <DialogFooter><Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>Cancelar</Button><Button type="submit" disabled={isPending || compatibleCategories.length === 0}>{isPending ? "Salvando..." : "Salvar alterações"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
