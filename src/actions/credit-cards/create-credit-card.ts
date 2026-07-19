"use server";

import { revalidatePath } from "next/cache";

import { createCreditCardSchema } from "@/actions/credit-cards/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
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

      return { ok: true, id: card.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível criar o cartão.",
      };
    }
  });
