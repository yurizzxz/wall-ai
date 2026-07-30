"use server";

import { revalidatePath } from "next/cache";

import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { updateTransactionSchema } from "@/actions/transactions/schema";
import { updateTransaction } from "@/modules/transactions/application/update-transaction";
import { createRepositories } from "@/services/repositories";

export const updateTransactionAction = authenticatedAction
  .inputSchema(updateTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { categories, transactions } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const transaction = await updateTransaction(
        { ...parsedInput, userId: ctx.user.id },
        { categories, transactions },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/transactions");

      return actionSuccess(transaction.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao atualizar lançamento",
        fallbackMessage: "Não foi possível atualizar o lançamento.",
      });
    }
  });
