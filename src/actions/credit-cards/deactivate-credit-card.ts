"use server";

import { revalidatePath } from "next/cache";

import { deactivateCreditCardSchema } from "@/actions/credit-cards/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
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

      return { ok: true, id: card.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível desativar o cartão.",
      };
    }
  });
