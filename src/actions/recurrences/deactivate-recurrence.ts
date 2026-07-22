"use server";

import { revalidatePath } from "next/cache";

import { deactivateRecurrenceSchema } from "@/actions/recurrences/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { deactivateRecurrence } from "@/modules/recurrences/application/deactivate-recurrence";
import { createRepositories } from "@/services/repositories";

export const deactivateRecurrenceAction = authenticatedAction
  .inputSchema(deactivateRecurrenceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { recurrences } = createRepositories(ctx.user.id);

    try {
      await deactivateRecurrence(
        { ...parsedInput, userId: ctx.user.id },
        recurrences,
      );

      revalidatePath("/dashboard/recurrences");
      return actionSuccess(parsedInput.recurrenceId);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao desativar recorrência",
        fallbackMessage: "Não foi possível desativar a recorrência.",
      });
    }
  });
