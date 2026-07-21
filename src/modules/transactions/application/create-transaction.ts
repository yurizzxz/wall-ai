import {
  assertAccountCanReceiveMovements,
  type Account,
} from "../../accounts/domain/account";
import type { Category } from "../../categories/domain/category";
import { assertCategoryAcceptsTransaction } from "../../categories/domain/category";
import {
  assertPurchaseFitsLimit,
  calculateAvailableLimit,
  type CreditCard,
} from "../../credit-cards/domain/credit-card";
import type { AmountInCents } from "../../shared/domain/money";
import {
  validateTransaction,
  type CreateTransactionInput,
} from "../domain/transaction";
import { BusinessError } from "../../shared/application/business-error";

export type TransactionRecord = CreateTransactionInput & {
  id: string;
  paidInvoiceId?: string;
  sourceRecurringTransactionId?: string;
};

export type CreateTransactionDependencies = {
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
  transactions: {
    create(input: CreateTransactionInput): Promise<TransactionRecord>;
  };
};

export async function createTransaction(
  rawInput: CreateTransactionInput,
  dependencies: CreateTransactionDependencies,
): Promise<TransactionRecord> {
  const input = validateTransaction(rawInput);
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
    const creditCard = await dependencies.creditCards.findById(
      input.userId,
      input.creditCardId!,
    );

    if (!creditCard || !creditCard.card.isActive) {
      throw new BusinessError(
        "CARD_NOT_FOUND_OR_INACTIVE",
        "Cartão não encontrado ou inativo.",
      );
    }

    const availableInCents = calculateAvailableLimit(
      creditCard.card.limitInCents,
      creditCard.committedInCents,
    );

    assertPurchaseFitsLimit(input.amountInCents, availableInCents);
  } else {
    const account = await dependencies.accounts.findById(
      input.userId,
      input.accountId!,
    );

    if (!account) {
      throw new BusinessError(
        "ACCOUNT_NOT_FOUND",
        "Conta não encontrada para esse usuário.",
      );
    }

    assertAccountCanReceiveMovements(account);
  }

  return dependencies.transactions.create(input);
}
