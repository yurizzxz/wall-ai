import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallmentTable,
  creditCardTable,
  invoiceTable,
} from "@/db/schema";
import { calculateInvoiceCycle } from "@/modules/invoices/domain/invoice-cycle";
import { BusinessError } from "@/modules/shared/application/business-error";
import { splitPurchaseIntoInstallments } from "@/modules/credit-cards/domain/credit-card";

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type PersistCreditCardInstallmentsInput = {
  tx: DatabaseTransaction;
  userId: string;
  purchaseId: string;
  creditCardId: string;
  amountInCents: number;
  installmentCount: number;
  occurredAt: Date;
};

export async function persistCreditCardInstallments({
  tx,
  userId,
  purchaseId,
  creditCardId,
  amountInCents,
  installmentCount,
  occurredAt,
}: PersistCreditCardInstallmentsInput): Promise<void> {
  const [creditCard] = await tx
    .select()
    .from(creditCardTable)
    .where(
      and(
        eq(creditCardTable.id, creditCardId),
        eq(creditCardTable.userId, userId),
        eq(creditCardTable.isActive, true),
      ),
    )
    .limit(1);

  if (!creditCard) {
    throw new BusinessError(
      "CARD_NOT_FOUND_OR_INACTIVE",
      "Cartão não encontrado ou inativo.",
    );
  }

  const amounts = splitPurchaseIntoInstallments(amountInCents, installmentCount);

  for (const [index, installmentAmount] of amounts.entries()) {
    const cycle = calculateInvoiceCycle({
      occurredAt,
      closingDay: creditCard.closingDay,
      dueDay: creditCard.dueDay,
      monthOffset: index,
    });

    await tx
      .insert(invoiceTable)
      .values({
        userId,
        creditCardId,
        totalInCents: 0,
        paidInCents: 0,
        status: "OPEN",
        ...cycle,
      })
      .onConflictDoNothing({
        target: [invoiceTable.creditCardId, invoiceTable.periodStart],
      });

    const [invoice] = await tx
      .select()
      .from(invoiceTable)
      .where(
        and(
          eq(invoiceTable.userId, userId),
          eq(invoiceTable.creditCardId, creditCardId),
          eq(invoiceTable.periodStart, cycle.periodStart),
        ),
      )
      .limit(1);

    if (!invoice || invoice.status !== "OPEN") {
      throw new BusinessError(
        "INVOICE_NOT_OPEN",
        "A parcela pertence a uma fatura que já foi fechada.",
      );
    }

    await tx.insert(creditCardInstallmentTable).values({
      purchaseId,
      invoiceId: invoice.id,
      number: index + 1,
      totalCount: installmentCount,
      amountInCents: installmentAmount,
      dueAt: cycle.dueAt,
    });

    const [updatedInvoice] = await tx
      .update(invoiceTable)
      .set({
        totalInCents: sql`${invoiceTable.totalInCents} + ${installmentAmount}`,
      })
      .where(
        and(
          eq(invoiceTable.id, invoice.id),
          eq(invoiceTable.userId, userId),
          eq(invoiceTable.status, "OPEN"),
        ),
      )
      .returning({ id: invoiceTable.id });

    if (!updatedInvoice) {
      throw new BusinessError(
        "INVOICE_NOT_OPEN",
        "A fatura foi fechada durante o lançamento da parcela.",
      );
    }
  }
}
