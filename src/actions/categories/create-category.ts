"use server";

import { revalidatePath } from "next/cache";

import { createCategorySchema } from "@/actions/categories/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { createCategory } from "@/modules/categories/application/create-category";
import { createRepositories } from "@/services/repositories";

export const createCategoryAction = authenticatedAction
  .inputSchema(createCategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { categories } = createRepositories(ctx.user.id);

    try {
      const category = await createCategory(
        { ...parsedInput, userId: ctx.user.id },
        categories,
      );

      revalidatePath("/dashboard/categories");

      return { ok: true, id: category.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível criar a categoria.",
      };
    }
  });
