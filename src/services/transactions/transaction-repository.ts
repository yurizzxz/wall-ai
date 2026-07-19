import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallmentTable,
  debtPaymentTable,
  savingsContributionTable,
  transactionTable,
} from "@/db/schema";
import type { CancelTransactionInput } from "@/modules/transactions/application/cancel-transaction";
import type { TransactionRecord } from "@/modules/transactions/application/create-transaction";
import type { UpdateTransactionInput } from "@/modules/transactions/application/update-transaction";
import type { CreateTransactionInput } from "@/modules/transactions/domain/transaction";
import { assertUserScope } from "@/services/shared/assert-user-scope";

function toTransactionRecord(
  row: typeof transactionTable.$inferSelect,
): TransactionRecord {
  return {
    id: row.id,
    userId: row.userId,
    description: row.description,
    amountInCents: row.amountInCents,
    kind: row.kind,
    status: row.status,
    paymentMethod: row.paymentMethod,
    categoryId: row.categoryId,
    accountId: row.accountId ?? undefined,
    creditCardId: row.creditCardId ?? undefined,
    paidInvoiceId: row.paidInvoiceId ?? undefined,
    sourceRecurringTransactionId: row.sourceRecurringTransactionId ?? undefined,
    occurredAt: row.occurredAt,
    dueAt: row.dueAt ?? undefined,
  };
}

export function createTransactionRepository(authenticatedUserId: string) {
  return {
    async findById(userId: string, transactionId: string): Promise<TransactionRecord | null> {
      assertUserScope(authenticatedUserId, userId);

      const [transaction] = await db
        .select()
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.id, transactionId),
            eq(transactionTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return transaction ? toTransactionRecord(transaction) : null;
    },

    async list(): Promise<TransactionRecord[]> {
      const transactions = await db
        .select()
        .from(transactionTable)
        .where(eq(transactionTable.userId, authenticatedUserId))
        .orderBy(desc(transactionTable.occurredAt));

      return transactions.map(toTransactionRecord);
    },

    async create(input: CreateTransactionInput): Promise<TransactionRecord> {
      assertUserScope(authenticatedUserId, input.userId);

      return db.transaction(async (tx) => {
        const [transaction] = await tx
          .insert(transactionTable)
          .values({
            userId: authenticatedUserId,
            accountId: input.accountId,
            categoryId: input.categoryId,
            creditCardId: input.creditCardId,
            description: input.description,
            amountInCents: input.amountInCents,
            kind: input.kind,
            status: input.status,
            paymentMethod: input.paymentMethod,
            occurredAt: input.occurredAt,
            dueAt: input.dueAt,
            settledAt: input.status === "SETTLED" ? input.occurredAt : undefined,
          })
          .returning();

        if (!transaction) {
          throw new Error("Não foi possível criar o lançamento.");
        }

        if (input.paymentMethod === "CREDIT_CARD") {
          await tx.insert(creditCardInstallmentTable).values({
            purchaseId: transaction.id,
            number: 1,
            totalCount: 1,
            amountInCents: input.amountInCents,
            dueAt: input.dueAt ?? input.occurredAt,
          });
        }

        return toTransactionRecord(transaction);
      });
    },

    async updateMetadata(input: UpdateTransactionInput): Promise<TransactionRecord> {
      assertUserScope(authenticatedUserId, input.userId);

      const [transaction] = await db
        .update(transactionTable)
        .set({ description: input.description, categoryId: input.categoryId })
        .where(
          and(
            eq(transactionTable.id, input.transactionId),
            eq(transactionTable.userId, authenticatedUserId),
          ),
        )
        .returning();

      if (!transaction) {
        throw new Error("Lançamento não encontrado.");
      }

      return toTransactionRecord(transaction);
    },

    async cancel(input: CancelTransactionInput): Promise<TransactionRecord> {
      assertUserScope(authenticatedUserId, input.userId);

      return db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(transactionTable)
          .where(
            and(
              eq(transactionTable.id, input.transactionId),
              eq(transactionTable.userId, authenticatedUserId),
            ),
          )
          .limit(1);

        if (!current || current.status === "CANCELLED") {
          throw new Error("Lançamento não encontrado ou já cancelado.");
        }

        if (current.paidInvoiceId) {
          throw new Error("Pagamento de fatura deve ser estornado pelo fluxo da fatura.");
        }

        const [[debtPayment], [savingsContribution]] = await Promise.all([
          tx
            .select({ id: debtPaymentTable.id })
            .from(debtPaymentTable)
            .where(eq(debtPaymentTable.transactionId, current.id))
            .limit(1),
          tx
            .select({ id: savingsContributionTable.id })
            .from(savingsContributionTable)
            .where(eq(savingsContributionTable.transactionId, current.id))
            .limit(1),
        ]);

        if (debtPayment) {
          throw new Error("Pagamento de dívida deve ser estornado pelo fluxo da dívida.");
        }

        if (savingsContribution) {
          throw new Error("Aporte deve ser estornado pelo fluxo do cofrinho.");
        }

        const [billedInstallment] = await tx
          .select({ id: creditCardInstallmentTable.id })
          .from(creditCardInstallmentTable)
          .where(
            and(
              eq(creditCardInstallmentTable.purchaseId, current.id),
              isNotNull(creditCardInstallmentTable.invoiceId),
            ),
          )
          .limit(1);

        if (billedInstallment) {
          throw new Error("Compra faturada deve ser estornada pelo fluxo da fatura.");
        }

        await tx
          .delete(creditCardInstallmentTable)
          .where(eq(creditCardInstallmentTable.purchaseId, current.id));

        const [transaction] = await tx
          .update(transactionTable)
          .set({ status: "CANCELLED", settledAt: null })
          .where(
            and(
              eq(transactionTable.id, current.id),
              eq(transactionTable.userId, authenticatedUserId),
              eq(transactionTable.status, current.status),
            ),
          )
          .returning();

        if (!transaction) {
          throw new Error("O lançamento foi alterado por outra operação.");
        }

        return toTransactionRecord(transaction);
      });
    },
  };
}
