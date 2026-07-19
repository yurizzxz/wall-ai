"use server";

import { revalidatePath } from "next/cache";

import { contributeToSavingsGoalSchema } from "@/actions/savings-goals/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { contributeToSavingsGoal } from "@/modules/savings-goals/application/contribute-to-savings-goal";
import { createRepositories } from "@/services/repositories";

export const contributeToSavingsGoalAction = authenticatedAction
  .inputSchema(contributeToSavingsGoalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, categories, savingsGoals } = createRepositories(
      ctx.user.id,
    );

    try {
      const goal = await contributeToSavingsGoal(
        { ...parsedInput, userId: ctx.user.id },
        { accounts, categories, savingsGoals, now: () => new Date() },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/savings-goals");
      revalidatePath("/dashboard/transactions");

      return { ok: true, id: goal.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível realizar o aporte.",
      };
    }
  });
