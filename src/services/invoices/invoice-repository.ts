import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { invoiceTable } from "@/db/schema";
import type {
  ApplyInvoicePaymentInput,
} from "@/modules/invoices/application/pay-invoice";
import type { Invoice } from "@/modules/invoices/domain/invoice";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export function createInvoiceRepository(authenticatedUserId: string) {
  return {
    async findById(userId: string, invoiceId: string): Promise<Invoice | null> {
      assertUserScope(authenticatedUserId, userId);

      const [invoice] = await db
        .select()
        .from(invoiceTable)
        .where(
          and(
            eq(invoiceTable.id, invoiceId),
            eq(invoiceTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return invoice ?? null;
    },

    async list(): Promise<Invoice[]> {
      return db
        .select()
        .from(invoiceTable)
        .where(eq(invoiceTable.userId, authenticatedUserId))
        .orderBy(asc(invoiceTable.dueAt));
    },

    async applyPayment(input: ApplyInvoicePaymentInput): Promise<Invoice> {
      assertUserScope(authenticatedUserId, input.userId);

      const [invoice] = await db
        .update(invoiceTable)
        .set({
          paidInCents: input.nextPaidInCents,
          status: input.nextStatus,
          paidAt: input.nextStatus === "PAID" ? input.paidAt : null,
        })
        .where(
          and(
            eq(invoiceTable.id, input.invoiceId),
            eq(invoiceTable.userId, authenticatedUserId),
          ),
        )
        .returning();

      if (!invoice) {
        throw new Error("Fatura não encontrada.");
      }

      return invoice;
    },
  };
}
