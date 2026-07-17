import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  creditCardInstallmentTable,
  transactionTable,
} from "@/db/schema";
import type {
  TransactionRecord,
} from "@/modules/transactions/application/create-transaction";
import type {
  CreateTransactionInput,
} from "@/modules/transactions/domain/transaction";
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
    occurredAt: row.occurredAt,
    dueAt: row.dueAt ?? undefined,
  };
}

export function createTransactionRepository(authenticatedUserId: string) {
  return {
    async findById(transactionId: string): Promise<TransactionRecord | null> {
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

      return db.transaction(async (databaseTransaction) => {
        const [transaction] = await databaseTransaction
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
          })
          .returning();

        if (!transaction) {
          throw new Error("Não foi possível criar o lançamento.");
        }

        if (input.paymentMethod === "CREDIT_CARD") {
          await databaseTransaction.insert(creditCardInstallmentTable).values({
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
  };
}
