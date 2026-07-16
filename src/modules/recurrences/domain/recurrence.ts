import {
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";
import type {
  PaymentMethod,
  TransactionKind,
} from "../../transactions/domain/transaction";

export type RecurrenceFrequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export type RecurringTransaction = {
  id: string;
  userId: string;
  description: string;
  amountInCents: AmountInCents;
  kind: TransactionKind;
  paymentMethod: PaymentMethod;
  frequency: RecurrenceFrequency;
  nextOccurrenceAt: Date;
  endsAt?: Date;
  isActive: boolean;
};

export function validateRecurrence(
  recurrence: RecurringTransaction,
): RecurringTransaction {
  if (!recurrence.description.trim()) {
    throw new Error("A descrição da recorrência é obrigatória.");
  }

  assertPositiveAmountInCents(recurrence.amountInCents);

  if (Number.isNaN(recurrence.nextOccurrenceAt.getTime())) {
    throw new Error("A próxima ocorrência é inválida.");
  }

  if (recurrence.endsAt && recurrence.endsAt < recurrence.nextOccurrenceAt) {
    throw new Error("O término não pode vir antes da próxima ocorrência.");
  }

  return {
    ...recurrence,
    description: recurrence.description.trim(),
  };
}

export function calculateNextOccurrence(
  current: Date,
  frequency: RecurrenceFrequency,
): Date {
  const next = new Date(current);

  if (frequency === "WEEKLY") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "MONTHLY") {
    const originalDay = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    next.setDate(
      Math.min(
        originalDay,
        daysInMonth(next.getFullYear(), next.getMonth()),
      ),
    );
  } else {
    const originalDay = next.getDate();
    const originalMonth = next.getMonth();
    next.setDate(1);
    next.setFullYear(next.getFullYear() + 1);
    next.setMonth(originalMonth);
    next.setDate(
      Math.min(
        originalDay,
        daysInMonth(next.getFullYear(), originalMonth),
      ),
    );
  }

  return next;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
