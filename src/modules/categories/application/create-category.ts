import type {
  Category,
  CategoryKind,
} from "../domain/category";

export type CreateCategoryInput = {
  userId: string;
  name: string;
  kind: CategoryKind;
  color?: string;
  icon?: string;
};

export type CategoryRepository = {
  findByNameAndKind(
    userId: string,
    name: string,
    kind: CategoryKind,
  ): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
};

export async function createCategory(
  input: CreateCategoryInput,
  repository: CategoryRepository,
): Promise<Category> {
  const name = input.name.trim();

  if (!input.userId) {
    throw new Error("A categoria precisa pertencer a um usuário.");
  }

  if (!name) {
    throw new Error("O nome da categoria é obrigatório.");
  }

  if (await repository.findByNameAndKind(input.userId, name, input.kind)) {
    throw new Error("Já existe uma categoria com esse nome e tipo.");
  }

  return repository.create({
    ...input,
    name,
    color: input.color?.trim() || undefined,
    icon: input.icon?.trim() || undefined,
  });
}
