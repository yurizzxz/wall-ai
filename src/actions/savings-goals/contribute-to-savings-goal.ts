"use server";

import { revalidatePath } from "next/cache";

import { contributeToSavingsGoalSchema } from "@/actions/savings-goals/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { contributeToSavingsGoal } from "@/modules/savings-goals/application/contribute-to-savings-goal";
import { createRepositories } from "@/services/repositories";

export const contributeToSavingsGoalAction = authenticatedAction
  .inputSchema(contributeToSavingsGoalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, savingsGoals } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const goal = await contributeToSavingsGoal(
        { ...parsedInput, userId: ctx.user.id },
        { accounts, savingsGoals, now: () => new Date() },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/savings-goals");
      revalidatePath("/dashboard/transactions");

      return actionSuccess(goal.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao realizar aporte",
        fallbackMessage: "Não foi possível realizar o aporte.",
      });
    }
  });
