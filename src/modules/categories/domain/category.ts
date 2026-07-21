import { BusinessError } from "../../shared/application/business-error";

export type CategoryKind = "INCOME" | "EXPENSE" | "BOTH";

export type Category = {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
  isActive: boolean;
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Dívidas",
  "Alimentação",
  "Lazer",
  "Roupas",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Assinaturas",
  "Outros",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Salário",
  "Freelance",
  "Rendimentos",
  "Reembolso",
  "Outros recebimentos",
] as const;

export function assertCategoryAcceptsTransaction(
  category: Category,
  transactionKind: "INCOME" | "EXPENSE",
): void {
  if (!category.isActive) {
    throw new BusinessError(
      "CATEGORY_INACTIVE",
      "A categoria selecionada está inativa.",
    );
  }

  if (category.kind !== "BOTH" && category.kind !== transactionKind) {
    throw new BusinessError(
      "CATEGORY_KIND_MISMATCH",
      "A categoria não aceita esse tipo de lançamento.",
    );
  }
}
