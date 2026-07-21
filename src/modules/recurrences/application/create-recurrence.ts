import {
  assertAccountCanReceiveMovements,
  type Account,
} from "../../accounts/domain/account";
import {
  assertCategoryAcceptsTransaction,
  type Category,
} from "../../categories/domain/category";
import {
  assertPurchaseFitsLimit,
  calculateAvailableLimit,
  type CreditCard,
} from "../../credit-cards/domain/credit-card";
import {
  validateRecurrence,
  type RecurrenceFrequency,
  type RecurringTransaction,
} from "../domain/recurrence";
import type { AmountInCents } from "../../shared/domain/money";
import type {
  PaymentMethod,
  TransactionKind,
} from "../../transactions/domain/transaction";
import { BusinessError } from "../../shared/application/business-error";

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

export type CreateRecurrenceDependencies = {
  recurrences: {
    create(input: CreateRecurrenceInput): Promise<RecurringTransaction>;
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
};

export async function createRecurrence(
  rawInput: CreateRecurrenceInput,
  dependencies: CreateRecurrenceDependencies,
): Promise<RecurringTransaction> {
  const input = validateRecurrence(rawInput);
  const category = await dependencies.categories.findById(
    input.userId,
    input.categoryId,
  );

  if (!category) {
    throw new BusinessError(
      "CATEGORY_NOT_FOUND",
      "Categoria não encontrada para esse usuário.",
    );
  }

  assertCategoryAcceptsTransaction(category, input.kind);

  if (input.paymentMethod === "CREDIT_CARD") {
    if (input.kind !== "EXPENSE" || !input.creditCardId || input.accountId) {
      throw new BusinessError("INVALID_CREDIT_RECURRENCE_SOURCE", "Recorrência no crédito precisa usar somente um cartão.");
    }

    const result = await dependencies.creditCards.findById(
      input.userId,
      input.creditCardId,
    );

    if (!result?.card.isActive) {
      throw new BusinessError("CARD_NOT_FOUND_OR_INACTIVE", "Cartão não encontrado ou inativo.");
    }

    assertPurchaseFitsLimit(
      input.amountInCents,
      calculateAvailableLimit(result.card.limitInCents, result.committedInCents),
    );
  } else {
    if (!input.accountId || input.creditCardId) {
      throw new BusinessError("INVALID_ACCOUNT_RECURRENCE_SOURCE", "Recorrência fora do crédito precisa usar somente uma conta.");
    }

    const account = await dependencies.accounts.findById(
      input.userId,
      input.accountId,
    );

    if (!account) {
      throw new BusinessError(
        "ACCOUNT_NOT_FOUND",
        "Conta não encontrada para esse usuário.",
      );
    }

    assertAccountCanReceiveMovements(account);
  }

  return dependencies.recurrences.create(input);
}
