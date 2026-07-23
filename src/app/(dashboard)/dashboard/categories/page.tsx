import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Tags,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/common/category-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCategories } from "@/modules/categories/application/list-categories";
import type { CategoryListItem } from "@/modules/categories/application/list-categories";
import type { CategoryKind } from "@/modules/categories/domain/category";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";
import { CreateCategoryDialog } from "@/app/(dashboard)/dashboard/categories/_components/create-category-dialog";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Organize seus lançamentos por categoria.",
};

type CategoryGroupProps = {
  id: string;
  title: string;
  description: string;
  emptyMessage: string;
  icon: LucideIcon;
  categories: CategoryListItem[];
};

const CATEGORY_GROUPS = [
  {
    kind: "EXPENSE",
    title: "Despesas",
    description: "Organize para onde seu dinheiro está indo.",
    emptyMessage: "Nenhuma categoria de despesa cadastrada.",
    icon: ArrowDownRight,
  },
  {
    kind: "INCOME",
    title: "Receitas",
    description: "Identifique de onde seu dinheiro está vindo.",
    emptyMessage: "Nenhuma categoria de receita cadastrada.",
    icon: ArrowUpRight,
  },
  {
    kind: "BOTH",
    title: "Receitas e despesas",
    description: "Categorias que podem ser usadas nos dois fluxos.",
    emptyMessage: "Nenhuma categoria compartilhada cadastrada.",
    icon: ArrowLeftRight,
  },
] satisfies ReadonlyArray<{
  kind: CategoryKind;
  title: string;
  description: string;
  emptyMessage: string;
  icon: LucideIcon;
}>;

function getCategoryColor(color?: string) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined;
}

function CategoryGroup({
  id,
  title,
  description,
  emptyMessage,
  icon: Icon,
  categories,
}: CategoryGroupProps) {
  return (
    <section className="px-4 py-5 sm:px-6" aria-labelledby={id}>
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={id} className="font-heading text-sm font-semibold">
              {title}
            </h2>
            <Badge variant="secondary">
              {categories.length}{" "}
              {categories.length === 1 ? "categoria" : "categorias"}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs/relaxed text-muted-foreground">
            {description}
          </p>

          {categories.length > 0 ? (
            <ul
              className="mt-4 flex flex-wrap gap-2"
              aria-label={`Categorias de ${title.toLowerCase()}`}
            >
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="inline-flex min-h-8 items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs font-medium text-foreground ring-1 ring-foreground/10"
                >
                  <span
                    className="size-2.5 rounded-full bg-primary"
                    style={{
                      backgroundColor: getCategoryColor(category.color),
                    }}
                    aria-hidden="true"
                  />

                  <CategoryIcon name={category.icon} className="size-3.5" />

                  <span>{category.name}</span>

                  {!category.isActive ? (
                    <Badge variant="outline" className="ml-1">
                      Inativa
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function CategoriesPage() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const categories = await listCategories(
    session.user.id,
    repositories.categories,
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Organização</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Categorias
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Classifique seus lançamentos para entender receitas e despesas com
            mais clareza.
          </p>
        </div>
        <CreateCategoryDialog />
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Tags className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Suas categorias</CardTitle>
              <CardDescription>
                {categories.length}{" "}
                {categories.length === 1
                  ? "categoria cadastrada"
                  : "categorias cadastradas"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y px-0">
          {CATEGORY_GROUPS.map((group) => (
            <CategoryGroup
              key={group.kind}
              id={`categories-${group.kind.toLowerCase()}`}
              {...group}
              categories={categories.filter(
                (category) => category.kind === group.kind,
              )}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
