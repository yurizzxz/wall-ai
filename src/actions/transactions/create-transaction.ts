"use server";

import { revalidatePath } from "next/cache";

import { authenticatedAction } from "@/actions/shared/authenticated";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
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
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/credit-cards");
      revalidatePath("/dashboard/invoices");

      return actionSuccess(transaction.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao criar lançamento",
        fallbackMessage: "Não foi possível criar o lançamento.",
      });
    }
  });
