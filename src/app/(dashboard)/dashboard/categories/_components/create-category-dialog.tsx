"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

import { createCategoryAction } from "@/actions/categories/create-category";
import {
  createCategorySchema,
  type CreateCategoryActionInput,
} from "@/actions/categories/schema";
import { CategoryIconPicker } from "@/app/(dashboard)/dashboard/categories/_components/category-icon-picker";
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
import { CATEGORY_KIND_LABELS } from "@/lib/formatters";

const DEFAULT_VALUES: CreateCategoryActionInput = {
  name: "",
  kind: "EXPENSE",
  color: "#38856f",
  icon: "shapes",
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

export function CreateCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateCategoryActionInput>({
    resolver: zodResolver(createCategorySchema) as Resolver<CreateCategoryActionInput>,
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
    }
  }

  function onSubmit(input: CreateCategoryActionInput) {
    form.clearErrors("root");

    startTransition(async () => {
      try {
        const result = await createCategoryAction(input);

        if (!result?.data?.ok) {
          form.setError("root", {
            type: "server",
            message:
              result?.data?.message ??
              "Não foi possível criar a categoria. Revise os dados e tente novamente.",
          });
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch {
        form.setError("root", {
          type: "server",
          message: "Não foi possível criar a categoria. Tente novamente.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" />}>
        <Plus aria-hidden="true" />
        Nova categoria
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Nova categoria</DialogTitle>
          <DialogDescription>
            Defina como seus lançamentos serão agrupados nos relatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="category-name" className="text-xs font-medium">
              Nome
            </label>
            <Input
              id="category-name"
              autoComplete="off"
              placeholder="Ex.: Alimentação"
              aria-invalid={Boolean(form.formState.errors.name)}
              aria-describedby={form.formState.errors.name ? "category-name-error" : undefined}
              {...form.register("name")}
            />
            <FieldError
              id="category-name-error"
              message={form.formState.errors.name?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category-kind" className="text-xs font-medium">
              Tipo de lançamento
            </label>
            <Controller
              control={form.control}
              name="kind"
              render={({ field, fieldState }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger
                    id="category-kind"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "category-kind-error" : undefined}
                  >
                    <SelectValue>
                      {[CATEGORY_KIND_LABELS[field.value]]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                    <SelectItem value="INCOME">Receita</SelectItem>
                    <SelectItem value="BOTH">Receita e despesa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError
              id="category-kind-error"
              message={form.formState.errors.kind?.message}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium">Ícone</span>
            <Controller
              control={form.control}
              name="icon"
              render={({ field }) => (
                <CategoryIconPicker
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <FieldError
              id="category-icon-error"
              message={form.formState.errors.icon?.message}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category-color" className="text-xs font-medium">
              Cor
            </label>
            <div className="flex items-center gap-3">
              <Input
                id="category-color"
                type="color"
                className="size-10 shrink-0 cursor-pointer p-1"
                aria-invalid={Boolean(form.formState.errors.color)}
                aria-describedby={form.formState.errors.color ? "category-color-error" : undefined}
                {...form.register("color")}
              />
              <span className="text-xs text-muted-foreground">
                Ajuda a reconhecer a categoria nos relatórios.
              </span>
            </div>
            <FieldError
              id="category-color-error"
              message={form.formState.errors.color?.message}
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
              {isPending ? "Criando..." : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
