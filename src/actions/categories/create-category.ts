"use server";

import { revalidatePath } from "next/cache";

import { createCategorySchema } from "@/actions/categories/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createCategory } from "@/modules/categories/application/create-category";
import { createRepositories } from "@/services/repositories";

export const createCategoryAction = authenticatedAction
  .inputSchema(createCategorySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { categories } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const category = await createCategory(
        { ...parsedInput, userId: ctx.user.id },
        categories,
      );

      revalidatePath("/dashboard/categories");

      return actionSuccess(category.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao criar categoria",
        fallbackMessage: "Não foi possível criar a categoria.",
      });
    }
  });
