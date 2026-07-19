"use server";

import { revalidatePath } from "next/cache";

import { deactivateAccountSchema } from "@/actions/accounts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { deactivateAccount } from "@/modules/accounts/application/deactivate-account";
import { createRepositories } from "@/services/repositories";

export const deactivateAccountAction = authenticatedAction
  .inputSchema(deactivateAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts } = createRepositories(ctx.user.id);

    try {
      const account = await deactivateAccount(
        { ...parsedInput, userId: ctx.user.id },
        { accounts },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/accounts");

      return { ok: true, id: account.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível desativar a conta.",
      };
    }
  });
