"use server";

import { revalidatePath } from "next/cache";

import { authenticatedAction } from "@/actions/shared/authenticated";
import { cancelTransactionSchema } from "@/actions/transactions/schema";
import { cancelTransaction } from "@/modules/transactions/application/cancel-transaction";
import { createRepositories } from "@/services/repositories";

export const cancelTransactionAction = authenticatedAction
  .inputSchema(cancelTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { transactions } = createRepositories(ctx.user.id);

    try {
      const transaction = await cancelTransaction(
        { ...parsedInput, userId: ctx.user.id },
        { transactions },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/transactions");

      return { ok: true, id: transaction.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível cancelar o lançamento.",
      };
    }
  });
