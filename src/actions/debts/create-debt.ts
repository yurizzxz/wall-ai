"use server";

import { revalidatePath } from "next/cache";

import { createDebtSchema } from "@/actions/debts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { createDebt } from "@/modules/debts/application/create-debt";
import { createRepositories } from "@/services/repositories";

export const createDebtAction = authenticatedAction
  .inputSchema(createDebtSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { debts } = createRepositories(ctx.user.id);

    try {
      const debt = await createDebt(
        { ...parsedInput, userId: ctx.user.id },
        debts,
      );

      revalidatePath("/dashboard/debts");

      return { ok: true, id: debt.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível criar a dívida.",
      };
    }
  });
