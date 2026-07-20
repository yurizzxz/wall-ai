import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  categoryTable,
  creditCardInstallmentTable,
  creditCardTable,
  financialAccountTable,
  recurringTransactionTable,
  transactionTable,
} from "@/db/schema";
import type { CreateRecurrenceInput } from "@/modules/recurrences/application/create-recurrence";
import type {
  ListRecurrencesInput,
  RecurrenceListItem,
} from "@/modules/recurrences/application/list-recurrences";
import type {
  PersistRecurrenceOccurrenceInput,
  ProcessableRecurrence,
} from "@/modules/recurrences/application/process-recurrence";
import type { RecurringTransaction } from "@/modules/recurrences/domain/recurrence";
import type { TransactionRecord } from "@/modules/transactions/application/create-transaction";
import { assertUserScope } from "@/services/shared/assert-user-scope";

function toRecurringTransaction(
  row: typeof recurringTransactionTable.$inferSelect,
): RecurringTransaction {
  return {
    id: row.id,
    userId: row.userId,
    description: row.description,
    amountInCents: row.amountInCents,
    kind: row.kind,
    paymentMethod: row.paymentMethod,
    frequency: row.frequency,
    nextOccurrenceAt: row.nextOccurrenceAt,
    endsAt: row.endsAt ?? undefined,
    isActive: row.isActive,
  };
}

function toProcessableRecurrence(
  row: typeof recurringTransactionTable.$inferSelect,
): ProcessableRecurrence {
  return {
    ...toRecurringTransaction(row),
    accountId: row.accountId ?? undefined,
    categoryId: row.categoryId,
    creditCardId: row.creditCardId ?? undefined,
  };
}

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

export function createRecurrenceRepository(authenticatedUserId: string) {
  return {
    async findById(userId: string, recurrenceId: string): Promise<RecurringTransaction | null> {
      assertUserScope(authenticatedUserId, userId);

      const [recurrence] = await db
        .select()
        .from(recurringTransactionTable)
        .where(
          and(
            eq(recurringTransactionTable.id, recurrenceId),
            eq(recurringTransactionTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return recurrence ? toRecurringTransaction(recurrence) : null;
    },

    async findProcessableById(
      userId: string,
      recurrenceId: string,
    ): Promise<ProcessableRecurrence | null> {
      assertUserScope(authenticatedUserId, userId);

      const [recurrence] = await db
        .select()
        .from(recurringTransactionTable)
        .where(
          and(
            eq(recurringTransactionTable.id, recurrenceId),
            eq(recurringTransactionTable.userId, authenticatedUserId),
          ),
        )
        .limit(1);

      return recurrence ? toProcessableRecurrence(recurrence) : null;
    },

    async list(): Promise<RecurringTransaction[]> {
      const recurrences = await db
        .select()
        .from(recurringTransactionTable)
        .where(eq(recurringTransactionTable.userId, authenticatedUserId))
        .orderBy(asc(recurringTransactionTable.nextOccurrenceAt));

      return recurrences.map(toRecurringTransaction);
    },

    async listForUser(
      input: ListRecurrencesInput,
    ): Promise<RecurrenceListItem[]> {
      assertUserScope(authenticatedUserId, input.userId);

      const conditions = [
        eq(recurringTransactionTable.userId, authenticatedUserId),
      ];

      if (input.isActive !== undefined) {
        conditions.push(
          eq(recurringTransactionTable.isActive, input.isActive),
        );
      }

      const recurrences = await db
        .select({
          recurrence: recurringTransactionTable,
          categoryName: categoryTable.name,
          accountName: financialAccountTable.name,
          creditCardName: creditCardTable.name,
        })
        .from(recurringTransactionTable)
        .innerJoin(
          categoryTable,
          and(
            eq(categoryTable.id, recurringTransactionTable.categoryId),
            eq(categoryTable.userId, authenticatedUserId),
          ),
        )
        .leftJoin(
          financialAccountTable,
          and(
            eq(financialAccountTable.id, recurringTransactionTable.accountId),
            eq(financialAccountTable.userId, authenticatedUserId),
          ),
        )
        .leftJoin(
          creditCardTable,
          and(
            eq(creditCardTable.id, recurringTransactionTable.creditCardId),
            eq(creditCardTable.userId, authenticatedUserId),
          ),
        )
        .where(and(...conditions))
        .orderBy(asc(recurringTransactionTable.nextOccurrenceAt));

      return recurrences.map(
        ({ recurrence, categoryName, accountName, creditCardName }) => ({
          ...toProcessableRecurrence(recurrence),
          categoryName,
          accountName: accountName ?? undefined,
          creditCardName: creditCardName ?? undefined,
        }),
      );
    },

    async create(input: CreateRecurrenceInput): Promise<RecurringTransaction> {
      assertUserScope(authenticatedUserId, input.userId);

      const [recurrence] = await db
        .insert(recurringTransactionTable)
        .values({
          userId: authenticatedUserId,
          accountId: input.accountId,
          categoryId: input.categoryId,
          creditCardId: input.creditCardId,
          description: input.description,
          amountInCents: input.amountInCents,
          kind: input.kind,
          paymentMethod: input.paymentMethod,
          frequency: input.frequency,
          nextOccurrenceAt: input.nextOccurrenceAt,
          endsAt: input.endsAt,
        })
        .returning();

      if (!recurrence) {
        throw new Error("Não foi possível criar a recorrência.");
      }

      return toRecurringTransaction(recurrence);
    },

    async processOccurrence(
      input: PersistRecurrenceOccurrenceInput,
    ): Promise<TransactionRecord> {
      assertUserScope(authenticatedUserId, input.userId);

      return db.transaction(async (tx) => {
        const [recurrence] = await tx
          .update(recurringTransactionTable)
          .set({
            nextOccurrenceAt: input.nextOccurrenceAt,
            isActive: input.nextIsActive,
          })
          .where(
            and(
              eq(recurringTransactionTable.id, input.recurrenceId),
              eq(recurringTransactionTable.userId, authenticatedUserId),
              eq(recurringTransactionTable.isActive, true),
              eq(recurringTransactionTable.nextOccurrenceAt, input.expectedOccurrenceAt),
            ),
          )
          .returning({ id: recurringTransactionTable.id });

        if (!recurrence) {
          throw new Error("A recorrência já foi processada por outra operação.");
        }

        const [transaction] = await tx
          .insert(transactionTable)
          .values({
            ...input.transaction,
            userId: authenticatedUserId,
            sourceRecurringTransactionId: input.recurrenceId,
            settledAt:
              input.transaction.status === "SETTLED"
                ? input.transaction.occurredAt
                : undefined,
          })
          .returning();

        if (!transaction) {
          throw new Error("Não foi possível criar o lançamento recorrente.");
        }

        if (input.transaction.paymentMethod === "CREDIT_CARD") {
          await tx.insert(creditCardInstallmentTable).values({
            purchaseId: transaction.id,
            number: 1,
            totalCount: 1,
            amountInCents: input.transaction.amountInCents,
            dueAt: input.transaction.dueAt ?? input.transaction.occurredAt,
          });
        }

        return toTransactionRecord(transaction);
      });
    },

    async scheduleNext(
      recurrenceId: string,
      nextOccurrenceAt: Date,
      isActive: boolean,
    ): Promise<RecurringTransaction> {
      const [recurrence] = await db
        .update(recurringTransactionTable)
        .set({ nextOccurrenceAt, isActive })
        .where(
          and(
            eq(recurringTransactionTable.id, recurrenceId),
            eq(recurringTransactionTable.userId, authenticatedUserId),
          ),
        )
        .returning();

      if (!recurrence) {
        throw new Error("Recorrência não encontrada.");
      }

      return toRecurringTransaction(recurrence);
    },

    async deactivate(recurrenceId: string): Promise<void> {
      const [recurrence] = await db
        .update(recurringTransactionTable)
        .set({ isActive: false })
        .where(
          and(
            eq(recurringTransactionTable.id, recurrenceId),
            eq(recurringTransactionTable.userId, authenticatedUserId),
          ),
        )
        .returning({ id: recurringTransactionTable.id });

      if (!recurrence) {
        throw new Error("Recorrência não encontrada.");
      }
    },
  };
}
