import type { Account } from "../../accounts/domain/account";
import { assertAccountCanReceiveMovements } from "../../accounts/domain/account";
import type { Category } from "../../categories/domain/category";
import { assertCategoryAcceptsTransaction } from "../../categories/domain/category";
import {
  assertPurchaseFitsLimit,
  calculateAvailableLimit,
  type CreditCard,
} from "../../credit-cards/domain/credit-card";
import {
  calculateNextOccurrence,
  type RecurringTransaction,
} from "../domain/recurrence";
import type { AmountInCents } from "../../shared/domain/money";
import type { TransactionRecord } from "../../transactions/application/create-transaction";
import type { CreateTransactionInput } from "../../transactions/domain/transaction";

export type ProcessableRecurrence = RecurringTransaction & {
  accountId?: string;
  categoryId: string;
  creditCardId?: string;
};

export type ProcessRecurrenceInput = {
  userId: string;
  recurrenceId: string;
};

export type PersistRecurrenceOccurrenceInput = {
  userId: string;
  recurrenceId: string;
  expectedOccurrenceAt: Date;
  nextOccurrenceAt: Date;
  nextIsActive: boolean;
  transaction: CreateTransactionInput;
};

export type ProcessRecurrenceDependencies = {
  recurrences: {
    findProcessableById(
      userId: string,
      recurrenceId: string,
    ): Promise<ProcessableRecurrence | null>;
    processOccurrence(
      input: PersistRecurrenceOccurrenceInput,
    ): Promise<TransactionRecord>;
  };
  accounts: {
    findById(userId: string, accountId: string): Promise<Account | null>;
  };
  categories: {
    findById(userId: string, categoryId: string): Promise<Category | null>;
  };
  creditCards: {
    findById(
      userId: string,
      creditCardId: string,
    ): Promise<{ card: CreditCard; committedInCents: AmountInCents } | null>;
  };
  now(): Date;
};

export async function processRecurrence(
  input: ProcessRecurrenceInput,
  dependencies: ProcessRecurrenceDependencies,
): Promise<TransactionRecord> {
  const recurrence = await dependencies.recurrences.findProcessableById(
    input.userId,
    input.recurrenceId,
  );

  if (!recurrence?.isActive) {
    throw new Error("Recorrência não encontrada ou inativa.");
  }

  const now = dependencies.now();

  if (recurrence.nextOccurrenceAt > now) {
    throw new Error("A recorrência ainda não está vencida.");
  }

  if (recurrence.endsAt && recurrence.nextOccurrenceAt > recurrence.endsAt) {
    throw new Error("A recorrência já terminou.");
  }

  const category = await dependencies.categories.findById(
    input.userId,
    recurrence.categoryId,
  );

  if (!category) {
    throw new Error("Categoria não encontrada para esse usuário.");
  }

  assertCategoryAcceptsTransaction(category, recurrence.kind);

  if (recurrence.paymentMethod === "CREDIT_CARD") {
    const result = recurrence.creditCardId
      ? await dependencies.creditCards.findById(input.userId, recurrence.creditCardId)
      : null;

    if (!result?.card.isActive) {
      throw new Error("Cartão não encontrado ou inativo.");
    }

    assertPurchaseFitsLimit(
      recurrence.amountInCents,
      calculateAvailableLimit(result.card.limitInCents, result.committedInCents),
    );
  } else {
    const account = recurrence.accountId
      ? await dependencies.accounts.findById(input.userId, recurrence.accountId)
      : null;

    if (!account) {
      throw new Error("Conta não encontrada para esse usuário.");
    }

    assertAccountCanReceiveMovements(account);
  }

  const nextOccurrenceAt = calculateNextOccurrence(
    recurrence.nextOccurrenceAt,
    recurrence.frequency,
  );
  const nextIsActive = !recurrence.endsAt || nextOccurrenceAt <= recurrence.endsAt;

  return dependencies.recurrences.processOccurrence({
    userId: input.userId,
    recurrenceId: input.recurrenceId,
    expectedOccurrenceAt: recurrence.nextOccurrenceAt,
    nextOccurrenceAt,
    nextIsActive,
    transaction: {
      userId: input.userId,
      accountId: recurrence.accountId,
      categoryId: recurrence.categoryId,
      creditCardId: recurrence.creditCardId,
      description: recurrence.description,
      amountInCents: recurrence.amountInCents,
      kind: recurrence.kind,
      status: "SETTLED",
      paymentMethod: recurrence.paymentMethod,
      occurredAt: recurrence.nextOccurrenceAt,
      dueAt: recurrence.paymentMethod === "CREDIT_CARD" ? recurrence.nextOccurrenceAt : undefined,
    },
  });
}
