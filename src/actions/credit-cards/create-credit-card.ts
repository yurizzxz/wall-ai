"use server";

import { revalidatePath } from "next/cache";

import { createCreditCardSchema } from "@/actions/credit-cards/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createCreditCard } from "@/modules/credit-cards/application/create-credit-card";
import { createRepositories } from "@/services/repositories";

export const createCreditCardAction = authenticatedAction
  .inputSchema(createCreditCardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { creditCards } = createRepositories(ctx.user.id);

    try {
      const card = await createCreditCard(
        { ...parsedInput, userId: ctx.user.id },
        creditCards,
      );

      revalidatePath("/dashboard/credit-cards");

      return actionSuccess(card.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao criar cartão",
        fallbackMessage: "Não foi possível criar o cartão.",
      });
    }
  });
