"use server";

import { revalidatePath } from "next/cache";

import { payDebtSchema } from "@/actions/debts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { payDebt } from "@/modules/debts/application/pay-debt";
import { createRepositories } from "@/services/repositories";

export const payDebtAction = authenticatedAction
  .inputSchema(payDebtSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, categories, debts } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const debt = await payDebt(
        { ...parsedInput, userId: ctx.user.id },
        { accounts, categories, debts, now: () => new Date() },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/debts");
      revalidatePath("/dashboard/transactions");

      return actionSuccess(debt.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao pagar dívida",
        fallbackMessage: "Não foi possível pagar a dívida.",
      });
    }
  });
