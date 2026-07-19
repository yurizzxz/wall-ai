"use server";

import { revalidatePath } from "next/cache";

import { payDebtSchema } from "@/actions/debts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { payDebt } from "@/modules/debts/application/pay-debt";
import { createRepositories } from "@/services/repositories";

export const payDebtAction = authenticatedAction
  .inputSchema(payDebtSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, categories, debts } = createRepositories(ctx.user.id);

    try {
      const debt = await payDebt(
        { ...parsedInput, userId: ctx.user.id },
        { accounts, categories, debts, now: () => new Date() },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/debts");
      revalidatePath("/dashboard/transactions");

      return { ok: true, id: debt.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível pagar a dívida.",
      };
    }
  });
