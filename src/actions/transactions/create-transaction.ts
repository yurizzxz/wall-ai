"use server";

import { revalidatePath } from "next/cache";

import { authenticatedAction } from "@/actions/shared/authenticated";
import { createTransactionSchema } from "@/actions/transactions/schema";
import { createTransaction } from "@/modules/transactions/application/create-transaction";
import { createRepositories } from "@/services/repositories";

export const createTransactionAction = authenticatedAction
  .inputSchema(createTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    
    const { accounts, categories, creditCards, transactions } =
      createRepositories(ctx.user.id);

    try {
      const transaction = await createTransaction(
        {
          ...parsedInput,
          userId: ctx.user.id,
        },
        {
          accounts,
          categories,
          creditCards,
          transactions,
        },
      );

      revalidatePath("/dashboard/transactions");

      return { ok: true, id: transaction.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível criar o lançamento.",
      };
    }
  });
