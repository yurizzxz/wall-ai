"use server";

import { revalidatePath } from "next/cache";

import { payInvoiceSchema } from "@/actions/invoices/schema";
import { authenticatedAction } from "@/actions/shared/authenticated";
import { payInvoice } from "@/modules/invoices/application/pay-invoice";
import { createRepositories } from "@/services/repositories";

export const payInvoiceAction = authenticatedAction
  .inputSchema(payInvoiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { accounts, categories, invoices } = createRepositories(ctx.user.id);

    try {
      const invoice = await payInvoice(
        { ...parsedInput, userId: ctx.user.id },
        { accounts, categories, invoices, now: () => new Date() },
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/invoices");
      revalidatePath("/dashboard/transactions");

      return { ok: true, id: invoice.id };
    } catch {
      return {
        ok: false,
        error: "OPERATION_FAILED" as const,
        message: "Não foi possível pagar a fatura.",
      };
    }
  });
