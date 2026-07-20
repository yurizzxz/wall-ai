import type { Category } from "../domain/category";

export type CategoryListItem = Category & {
  color?: string;
  icon?: string;
};

export type ListCategoriesRepository = {
  listForUser(userId: string): Promise<CategoryListItem[]>;
};

export async function listCategories(
  userId: string,
  repository: ListCategoriesRepository,
): Promise<CategoryListItem[]> {
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  return repository.listForUser(userId);
}
