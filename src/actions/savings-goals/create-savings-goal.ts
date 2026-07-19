"use server";

import { revalidatePath } from "next/cache";

import { createSavingsGoalSchema } from "@/actions/savings-goals/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { createSavingsGoal } from "@/modules/savings-goals/application/create-savings-goal";
import { createRepositories } from "@/services/repositories";

export const createSavingsGoalAction = authenticatedAction
  .inputSchema(createSavingsGoalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { savingsGoals } = createRepositories(ctx.user.id);

    try {
      const goal = await createSavingsGoal(
        { ...parsedInput, userId: ctx.user.id },
        savingsGoals,
      );

      revalidatePath("/dashboard/savings-goals");

      return { ok: true, id: goal.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível criar o cofrinho.",
      };
    }
  });
