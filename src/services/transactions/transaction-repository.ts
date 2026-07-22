import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  categoryTable,
  creditCardInstallmentTable,
  creditCardTable,
  debtPaymentTable,
  financialAccountTable,
  savingsContributionTable,
  transactionTable,
} from "@/db/schema";
import type { CancelTransactionInput } from "@/modules/transactions/application/cancel-transaction";
import type { TransactionRecord } from "@/modules/transactions/application/create-transaction";
import type {
  ListTransactionsInput,
  TransactionListItem,
  TransactionPage,
} from "@/modules/transactions/application/list-transactions";
import type { UpdateTransactionInput } from "@/modules/transactions/application/update-transaction";
import type { CreateTransactionInput } from "@/modules/transactions/domain/transaction";
import { assertUserScope } from "@/services/shared/assert-user-scope";
import { persistCreditCardInstallments } from "@/services/invoices/persist-credit-card-installments";

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

    async listPage(input: ListTransactionsInput): Promise<TransactionPage> {
      assertUserScope(authenticatedUserId, input.userId);

      const conditions = [
        eq(transactionTable.userId, authenticatedUserId),
      ];

      if (input.kind) {
        conditions.push(eq(transactionTable.kind, input.kind));
      }

      if (input.status) {
        conditions.push(eq(transactionTable.status, input.status));
      }

      if (input.from) {
        conditions.push(gte(transactionTable.occurredAt, input.from));
      }

      if (input.to) {
        conditions.push(lte(transactionTable.occurredAt, input.to));
      }

      const where = and(...conditions);
      const offset = (input.page - 1) * input.pageSize;
      const [rows, totalResult] = await Promise.all([
        db
          .select({
            transaction: transactionTable,
            categoryName: categoryTable.name,
            accountName: financialAccountTable.name,
            creditCardName: creditCardTable.name,
          })
          .from(transactionTable)
          .innerJoin(
            categoryTable,
            and(
              eq(categoryTable.id, transactionTable.categoryId),
              eq(categoryTable.userId, authenticatedUserId),
            ),
          )
          .leftJoin(
            financialAccountTable,
            and(
              eq(financialAccountTable.id, transactionTable.accountId),
              eq(financialAccountTable.userId, authenticatedUserId),
            ),
          )
          .leftJoin(
            creditCardTable,
            and(
              eq(creditCardTable.id, transactionTable.creditCardId),
              eq(creditCardTable.userId, authenticatedUserId),
            ),
          )
          .where(where)
          .orderBy(desc(transactionTable.occurredAt))
          .limit(input.pageSize)
          .offset(offset),
        db
          .select({ total: sql<number>`count(*)` })
          .from(transactionTable)
          .where(where),
      ]);
      const total = Number(totalResult[0]?.total ?? 0);
      const installmentCounts = rows.length > 0
        ? await db
            .select({
              purchaseId: creditCardInstallmentTable.purchaseId,
              totalCount: creditCardInstallmentTable.totalCount,
            })
            .from(creditCardInstallmentTable)
            .where(
              inArray(
                creditCardInstallmentTable.purchaseId,
                rows.map(({ transaction }) => transaction.id),
              ),
            )
        : [];
      const installmentCountByPurchase = new Map(
        installmentCounts.map(({ purchaseId, totalCount }) => [
          purchaseId,
          totalCount,
        ]),
      );

      return {
        items: rows.map(
          ({ transaction, categoryName, accountName, creditCardName }): TransactionListItem => ({
            ...toTransactionRecord(transaction),
            installmentCount: installmentCountByPurchase.get(transaction.id),
            notes: transaction.notes ?? undefined,
            settledAt: transaction.settledAt ?? undefined,
            categoryName,
            accountName: accountName ?? undefined,
            creditCardName: creditCardName ?? undefined,
          }),
        ),
        page: input.page,
        pageSize: input.pageSize,
        total,
        pageCount: Math.ceil(total / input.pageSize),
      };
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
          await persistCreditCardInstallments({
            tx,
            userId: authenticatedUserId,
            purchaseId: transaction.id,
            creditCardId: input.creditCardId!,
            amountInCents: input.amountInCents,
            installmentCount: input.installmentCount ?? 1,
            occurredAt: input.occurredAt,
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

        const installments = await tx
          .select({
            invoiceId: creditCardInstallmentTable.invoiceId,
            amountInCents: creditCardInstallmentTable.amountInCents,
            invoiceStatus: invoiceTable.status,
          })
          .from(creditCardInstallmentTable)
          .leftJoin(
            invoiceTable,
            eq(invoiceTable.id, creditCardInstallmentTable.invoiceId),
          )
          .where(
            eq(creditCardInstallmentTable.purchaseId, current.id),
          );

        if (
          installments.some(
            (installment) =>
              installment.invoiceId && installment.invoiceStatus !== "OPEN",
          )
        ) {
          throw new Error("Compra faturada deve ser estornada pelo fluxo da fatura.");
        }

        const reductionsByInvoice = new Map<string, number>();
        for (const installment of installments) {
          if (installment.invoiceId) {
            reductionsByInvoice.set(
              installment.invoiceId,
              (reductionsByInvoice.get(installment.invoiceId) ?? 0) +
                installment.amountInCents,
            );
          }
        }

        for (const [invoiceId, reductionInCents] of reductionsByInvoice) {
          const [updatedInvoice] = await tx
            .update(invoiceTable)
            .set({
              totalInCents: sql`greatest(0, ${invoiceTable.totalInCents} - ${reductionInCents})`,
            })
            .where(
              and(
                eq(invoiceTable.id, invoiceId),
                eq(invoiceTable.userId, authenticatedUserId),
                eq(invoiceTable.status, "OPEN"),
              ),
            )
            .returning({ id: invoiceTable.id });

          if (!updatedInvoice) {
            throw new Error("Compra faturada deve ser estornada pelo fluxo da fatura.");
          }
        }

        await tx
          .delete(creditCardInstallmentTable)
          .where(eq(creditCardInstallmentTable.purchaseId, current.id));

        for (const invoiceId of reductionsByInvoice.keys()) {
          await tx
            .delete(invoiceTable)
            .where(
              and(
                eq(invoiceTable.id, invoiceId),
                eq(invoiceTable.userId, authenticatedUserId),
                eq(invoiceTable.status, "OPEN"),
                eq(invoiceTable.totalInCents, 0),
                eq(invoiceTable.paidInCents, 0),
              ),
            );
        }

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
