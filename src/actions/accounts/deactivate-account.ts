"use server";

import { revalidatePath } from "next/cache";

import { deactivateAccountSchema } from "@/actions/accounts/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { createRepositories } from "@/services/repositories";
import {
  deactivateAccount,
  DeactivateAccountError,
  type DeactivateAccountErrorCode,
} from "@/modules/accounts/application/deactivate-account";

const ERROR_MESSAGES = {
  ACCOUNT_NOT_FOUND: "Conta não encontrada.",
  ACCOUNT_ALREADY_INACTIVE: "Esta conta já está inativa.",
  ACCOUNT_HAS_BALANCE:
    "Transfira ou zere o saldo antes de desativar a conta.",
  ACCOUNT_HAS_PENDING_TRANSACTIONS:
    "Resolva os lançamentos pendentes antes de desativar a conta.",
} satisfies Record<DeactivateAccountErrorCode, string>;

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
    } catch (error) {
      if (error instanceof DeactivateAccountError) {
        return {
          ok: false,
          error: error.code,
          message: ERROR_MESSAGES[error.code],
        };
      }
      
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível desativar a conta.",
      };
    }
  });
