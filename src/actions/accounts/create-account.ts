"use server";

import { revalidatePath } from "next/cache";

import { createAccountSchema } from "@/actions/accounts/schema";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { createAccount } from "@/modules/accounts/application/create-account";
import { createRepositories } from "@/services/repositories";
import { authenticatedAction } from "@/actions/shared/authenticated";

export const createAccountAction = authenticatedAction
  .inputSchema(createAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts } = createRepositories(ctx.user.id);

    try {
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
