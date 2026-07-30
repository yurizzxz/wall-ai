"use server";

import { revalidatePath } from "next/cache";

import { deactivateAccountSchema } from "@/actions/accounts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createRepositories } from "@/services/repositories";
import { deactivateAccount } from "@/modules/accounts/application/deactivate-account";

export const deactivateAccountAction = authenticatedAction
  .inputSchema(deactivateAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const account = await deactivateAccount(
        { ...parsedInput, userId: ctx.user.id },
        { accounts },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/accounts");

      return actionSuccess(account.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao desativar conta",
        fallbackMessage: "Não foi possível desativar a conta.",
      });
    }
  });
