"use server";

import { revalidatePath } from "next/cache";

import { createAccountSchema } from "@/actions/accounts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createAccount } from "@/modules/accounts/application/create-account";
import { createRepositories } from "@/services/repositories";

export const createAccountAction = authenticatedAction
  .inputSchema(createAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const account = await createAccount(
        {
          ...parsedInput,
          userId: ctx.user.id,
        },
        accounts,
      );

      revalidatePath("/dashboard/accounts");

      return actionSuccess(account.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao criar conta",
        fallbackMessage: "Não foi possível criar a conta.",
      });
    }
  });
