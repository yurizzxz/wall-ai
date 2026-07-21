"use server";

import { revalidatePath } from "next/cache";

import { deactivateCreditCardSchema } from "@/actions/credit-cards/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { deactivateCreditCard } from "@/modules/credit-cards/application/deactivate-credit-card";
import { createRepositories } from "@/services/repositories";

export const deactivateCreditCardAction = authenticatedAction
  .inputSchema(deactivateCreditCardSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { creditCards } = createRepositories(ctx.user.id);

    try {
      const card = await deactivateCreditCard(
        { ...parsedInput, userId: ctx.user.id },
        { creditCards },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/credit-cards");

      return actionSuccess(card.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao desativar cartão",
        fallbackMessage: "Não foi possível desativar o cartão.",
      });
    }
  });
