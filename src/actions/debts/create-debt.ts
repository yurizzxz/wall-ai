"use server";

import { revalidatePath } from "next/cache";

import { createDebtSchema } from "@/actions/debts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createDebt } from "@/modules/debts/application/create-debt";
import { createRepositories } from "@/services/repositories";

export const createDebtAction = authenticatedAction
  .inputSchema(createDebtSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { debts } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const debt = await createDebt(
        { ...parsedInput, userId: ctx.user.id },
        debts,
      );

      revalidatePath("/dashboard/debts");

      return actionSuccess(debt.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao criar dívida",
        fallbackMessage: "Não foi possível criar a dívida.",
      });
    }
  });
