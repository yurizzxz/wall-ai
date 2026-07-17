import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { categoryTable } from "@/db/schema";
import type {
  Category,
  CategoryKind,
} from "@/modules/categories/domain/category";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export type CreateCategoryInput = {
  userId: string;
  name: string;
  kind: CategoryKind;
  color?: string;
  icon?: string;
};

export function createCategoryRepository(authenticatedUserId: string) {
  return {
    async findById(userId: string, categoryId: string): Promise<Category | null> {
      assertUserScope(authenticatedUserId, userId);

      const [category] = await db
        .select()
        .from(categoryTable)
        .where(
          and(
            eq(categoryTable.id, categoryId),
            eq(categoryTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return category ?? null;
    },

    async list(): Promise<Category[]> {
      return db
        .select()
        .from(categoryTable)
        .where(eq(categoryTable.userId, authenticatedUserId))
        .orderBy(asc(categoryTable.name));
    },

    async create(input: CreateCategoryInput): Promise<Category> {
      assertUserScope(authenticatedUserId, input.userId);

      const [category] = await db
        .insert(categoryTable)
        .values({
          userId: authenticatedUserId,
          name: input.name,
          kind: input.kind,
          color: input.color,
          icon: input.icon,
        })
        .returning();

      if (!category) {
        throw new Error("Não foi possível criar a categoria.");
      }

      return category;
    },
  };
}
