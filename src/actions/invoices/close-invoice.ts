"use server";

import { revalidatePath } from "next/cache";

import { closeInvoiceSchema } from "@/actions/invoices/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { closeInvoice } from "@/modules/invoices/application/close-invoice";
import { createRepositories } from "@/services/repositories";

export const closeInvoiceAction = authenticatedAction
  .inputSchema(closeInvoiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { invoices } = createRepositories(ctx.user.id);

    try {
      const invoice = await closeInvoice(
        { ...parsedInput, userId: ctx.user.id },
        { invoices, now: () => new Date() },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/invoices");

      return { ok: true, id: invoice.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível fechar a fatura.",
      };
    }
  });
