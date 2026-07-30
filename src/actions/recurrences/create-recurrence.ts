"use server";

import { revalidatePath } from "next/cache";

import { createRecurrenceSchema } from "@/actions/recurrences/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createRecurrence } from "@/modules/recurrences/application/create-recurrence";
import { createRepositories } from "@/services/repositories";

export const createRecurrenceAction = authenticatedAction
  .inputSchema(createRecurrenceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, categories, creditCards, recurrences } =
      createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const recurrence = await createRecurrence(
        { ...parsedInput, userId: ctx.user.id },
        { accounts, categories, creditCards, recurrences },
      );

      revalidatePath("/dashboard/recurrences");

      return actionSuccess(recurrence.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao criar recorrência",
        fallbackMessage: "Não foi possível criar a recorrência.",
      });
    }
  });
