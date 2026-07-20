import { and, asc, eq, gte, inArray, isNull, lte, ne } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallmentTable,
  creditCardTable,
  invoiceTable,
  transactionTable,
} from "@/db/schema";
import type { ApplyInvoicePaymentInput } from "@/modules/invoices/application/pay-invoice";
import type {
  InvoiceListItem,
  ListInvoicesInput,
} from "@/modules/invoices/application/list-invoices";
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

    async listForUser(input: ListInvoicesInput): Promise<InvoiceListItem[]> {
      assertUserScope(authenticatedUserId, input.userId);

      const conditions = [eq(invoiceTable.userId, authenticatedUserId)];

      if (input.status) {
        conditions.push(eq(invoiceTable.status, input.status));
      }

      const invoices = await db
        .select({
          invoice: invoiceTable,
          creditCardName: creditCardTable.name,
        })
        .from(invoiceTable)
        .innerJoin(
          creditCardTable,
          and(
            eq(creditCardTable.id, invoiceTable.creditCardId),
            eq(creditCardTable.userId, authenticatedUserId),
          ),
        )
        .where(and(...conditions))
        .orderBy(asc(invoiceTable.dueAt));

      return invoices.map(({ invoice, creditCardName }) => ({
        ...invoice,
        paidAt: invoice.paidAt ?? undefined,
        creditCardName,
        outstandingInCents: Math.max(
          0,
          invoice.totalInCents - invoice.paidInCents,
        ),
      }));
    },

    async applyPayment(input: ApplyInvoicePaymentInput): Promise<Invoice> {
      assertUserScope(authenticatedUserId, input.userId);

      return db.transaction(async (tx) => {
        const [invoice] = await tx
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
              eq(invoiceTable.paidInCents, input.expectedPaidInCents),
            ),
          )
          .returning();

        if (!invoice) {
          throw new Error("A fatura foi alterada por outra operação.");
        }

        await tx.insert(transactionTable).values({
          userId: authenticatedUserId,
          accountId: input.accountId,
          categoryId: input.categoryId,
          paidInvoiceId: input.invoiceId,
          description: input.description,
          amountInCents: input.amountInCents,
          kind: "EXPENSE",
          status: "SETTLED",
          paymentMethod: input.paymentMethod,
          occurredAt: input.paidAt,
          settledAt: input.paidAt,
        });

        return invoice;
      });
    },

    async close(userId: string, invoiceId: string): Promise<Invoice> {
      assertUserScope(authenticatedUserId, userId);

      return db.transaction(async (tx) => {
        const [currentInvoice] = await tx
          .select()
          .from(invoiceTable)
          .where(
            and(
              eq(invoiceTable.id, invoiceId),
              eq(invoiceTable.userId, authenticatedUserId),
              eq(invoiceTable.status, "OPEN"),
            ),
          )
          .limit(1);

        if (!currentInvoice) {
          throw new Error("Fatura aberta não encontrada.");
        }

        const installments = await tx
          .select({
            id: creditCardInstallmentTable.id,
            amountInCents: creditCardInstallmentTable.amountInCents,
          })
          .from(creditCardInstallmentTable)
          .innerJoin(
            transactionTable,
            eq(creditCardInstallmentTable.purchaseId, transactionTable.id),
          )
          .where(
            and(
              eq(transactionTable.userId, authenticatedUserId),
              eq(transactionTable.creditCardId, currentInvoice.creditCardId),
              ne(transactionTable.status, "CANCELLED"),
              isNull(creditCardInstallmentTable.invoiceId),
              gte(creditCardInstallmentTable.dueAt, currentInvoice.periodStart),
              lte(creditCardInstallmentTable.dueAt, currentInvoice.periodEnd),
            ),
          );

        if (installments.length > 0) {
          await tx
            .update(creditCardInstallmentTable)
            .set({ invoiceId })
            .where(
              inArray(
                creditCardInstallmentTable.id,
                installments.map((installment) => installment.id),
              ),
            );
        }

        const totalInCents = installments.reduce(
          (total, installment) => total + installment.amountInCents,
          0,
        );
        const [invoice] = await tx
          .update(invoiceTable)
          .set({ totalInCents, status: "CLOSED" })
          .where(
            and(
              eq(invoiceTable.id, invoiceId),
              eq(invoiceTable.userId, authenticatedUserId),
              eq(invoiceTable.status, "OPEN"),
            ),
          )
          .returning();

        if (!invoice) {
          throw new Error("A fatura foi fechada por outra operação.");
        }

        return invoice;
      });
    },
  };
}
