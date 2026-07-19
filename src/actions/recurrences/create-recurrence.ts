"use server";

import { revalidatePath } from "next/cache";

import { createRecurrenceSchema } from "@/actions/recurrences/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { createRecurrence } from "@/modules/recurrences/application/create-recurrence";
import { createRepositories } from "@/services/repositories";

export const createRecurrenceAction = authenticatedAction
  .inputSchema(createRecurrenceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, categories, creditCards, recurrences } =
      createRepositories(ctx.user.id);

    try {
      const recurrence = await createRecurrence(
        { ...parsedInput, userId: ctx.user.id },
        { accounts, categories, creditCards, recurrences },
      );

      revalidatePath("/dashboard/recurrences");

      return { ok: true, id: recurrence.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível criar a recorrência.",
      };
    }
  });
