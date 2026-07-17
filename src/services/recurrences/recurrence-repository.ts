import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { recurringTransactionTable } from "@/db/schema";
import type {
  RecurrenceFrequency,
  RecurringTransaction,
} from "@/modules/recurrences/domain/recurrence";
import type { AmountInCents } from "@/modules/shared/domain/money";
import type {
  PaymentMethod,
  TransactionKind,
} from "@/modules/transactions/domain/transaction";
import { assertUserScope } from "@/services/shared/assert-user-scope";

export type CreateRecurrenceInput = {
  userId: string;
  accountId?: string;
  categoryId: string;
  creditCardId?: string;
  description: string;
  amountInCents: AmountInCents;
  kind: TransactionKind;
  paymentMethod: PaymentMethod;
  frequency: RecurrenceFrequency;
  nextOccurrenceAt: Date;
  endsAt?: Date;
};

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

export function createRecurrenceRepository(authenticatedUserId: string) {
  return {
    async findById(
      userId: string,
      recurrenceId: string,
    ): Promise<RecurringTransaction | null> {
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

    async list(): Promise<RecurringTransaction[]> {
      const recurrences = await db
        .select()
        .from(recurringTransactionTable)
        .where(eq(recurringTransactionTable.userId, authenticatedUserId))
        .orderBy(asc(recurringTransactionTable.nextOccurrenceAt));

      return recurrences.map(toRecurringTransaction);
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
