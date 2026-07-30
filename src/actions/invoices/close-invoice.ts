"use server";

import { revalidatePath } from "next/cache";

import { closeInvoiceSchema } from "@/actions/invoices/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { enforceRateLimit } from "@/actions/shared/enforce-rate-limit";
import { actionSuccess, handleActionError } from "@/actions/shared/handle-action-error";
import { closeInvoice } from "@/modules/invoices/application/close-invoice";
import { createRepositories } from "@/services/repositories";

export const closeInvoiceAction = authenticatedAction
  .inputSchema(closeInvoiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { invoices } = createRepositories(ctx.user.id);

    try {
      await enforceRateLimit(ctx.user.id);

      const invoice = await closeInvoice(
        { ...parsedInput, userId: ctx.user.id },
        { invoices, now: () => new Date() },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/invoices");

      return actionSuccess(invoice.id);
    } catch (error) {
      return handleActionError(error, {
        context: "Erro ao fechar fatura",
        fallbackMessage: "Não foi possível fechar a fatura.",
      });
    }
  });
