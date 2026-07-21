"use server";

import { revalidatePath } from "next/cache";

import { processRecurrenceSchema } from "@/actions/recurrences/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { processRecurrence } from "@/modules/recurrences/application/process-recurrence";
import { createRepositories } from "@/services/repositories";

export const processRecurrenceAction = authenticatedAction
  .inputSchema(processRecurrenceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, categories, creditCards, recurrences } =
      createRepositories(ctx.user.id);

    try {
      const transaction = await processRecurrence(
        { ...parsedInput, userId: ctx.user.id },
        {
          accounts,
          categories,
          creditCards,
          recurrences,
          now: () => new Date(),
        },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/recurrences");
      revalidatePath("/dashboard/transactions");

      return actionSuccess(transaction.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao processar recorrência",
        fallbackMessage: "Não foi possível processar a recorrência.",
      });
    }
  });
