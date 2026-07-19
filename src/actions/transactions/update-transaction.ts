"use server";

import { revalidatePath } from "next/cache";

import { authenticatedAction } from "@/actions/shared/authenticated";
import { updateTransactionSchema } from "@/actions/transactions/schema";
import { updateTransaction } from "@/modules/transactions/application/update-transaction";
import { createRepositories } from "@/services/repositories";

export const updateTransactionAction = authenticatedAction
  .inputSchema(updateTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { categories, transactions } = createRepositories(ctx.user.id);

    try {
      const transaction = await updateTransaction(
        { ...parsedInput, userId: ctx.user.id },
        { categories, transactions },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/transactions");

      return { ok: true, id: transaction.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível atualizar o lançamento.",
      };
    }
  });
