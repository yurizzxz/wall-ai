"use server";

import { revalidatePath } from "next/cache";

import { createAccountSchema } from "@/actions/accounts/schema";
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

      revalidatePath("/");

      return { ok: true, id: account.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível criar a conta.",
      };
    }
  });
