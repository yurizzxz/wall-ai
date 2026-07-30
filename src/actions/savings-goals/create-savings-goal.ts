"use server";

import { revalidatePath } from "next/cache";

import { createSavingsGoalSchema } from "@/actions/savings-goals/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createSavingsGoal } from "@/modules/savings-goals/application/create-savings-goal";
import { createRepositories } from "@/services/repositories";

export const createSavingsGoalAction = authenticatedAction
  .inputSchema(createSavingsGoalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { savingsGoals } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const goal = await createSavingsGoal(
        { ...parsedInput, userId: ctx.user.id },
        savingsGoals,
      );

      revalidatePath("/dashboard/savings-goals");

      return actionSuccess(goal.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao criar cofrinho",
        fallbackMessage: "Não foi possível criar o cofrinho.",
      });
    }
  });
