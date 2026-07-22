import { and, asc, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import { recurringTransactionTable } from "@/db/schema";
import { processRecurrence } from "@/modules/recurrences/application/process-recurrence";
import { createRepositories } from "@/services/repositories";

const RECURRENCE_BATCH_SIZE = 100;
const MAX_OCCURRENCES_PER_RECURRENCE = 24;

export type ProcessDueRecurrencesResult = {
  processed: number;
  failed: number;
};

export async function processDueRecurrences(
  now: Date,
): Promise<ProcessDueRecurrencesResult> {
  const dueRecurrences = await db
    .select({
      id: recurringTransactionTable.id,
      userId: recurringTransactionTable.userId,
    })
    .from(recurringTransactionTable)
    .where(
      and(
        eq(recurringTransactionTable.isActive, true),
        lte(recurringTransactionTable.nextOccurrenceAt, now),
      ),
    )
    .orderBy(asc(recurringTransactionTable.nextOccurrenceAt))
    .limit(RECURRENCE_BATCH_SIZE);

  let processed = 0;
  let failed = 0;

  for (const due of dueRecurrences) {
    const repositories = createRepositories(due.userId);

    try {
      for (let attempt = 0; attempt < MAX_OCCURRENCES_PER_RECURRENCE; attempt += 1) {
        const recurrence = await repositories.recurrences.findProcessableById(
          due.userId,
          due.id,
        );

        if (!recurrence?.isActive || recurrence.nextOccurrenceAt > now) break;

        if (recurrence.endsAt && recurrence.nextOccurrenceAt > recurrence.endsAt) {
          await repositories.recurrences.deactivate(recurrence.id);
          break;
        }

        await processRecurrence(
          { userId: due.userId, recurrenceId: due.id },
          {
            accounts: repositories.accounts,
            categories: repositories.categories,
            creditCards: repositories.creditCards,
            recurrences: repositories.recurrences,
            now: () => now,
          },
        );
        processed += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("Erro ao processar recorrência agendada", {
        recurrenceId: due.id,
        error,
      });
    }
  }

  return { processed, failed };
}
