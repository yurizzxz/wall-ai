import {
  assertPositiveAmountInCents,
  type AmountInCents,
} from "../../shared/domain/money";
import { BusinessError } from "../../shared/application/business-error";

export type TransactionKind = "INCOME" | "EXPENSE";
export type TransactionStatus = "PENDING" | "SETTLED" | "CANCELLED";
export type PaymentMethod =
  | "CASH"
  | "PIX"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "CREDIT_CARD";

export type AccountPaymentMethod = Exclude<PaymentMethod, "CREDIT_CARD">;

export type CreateTransactionInput = {
  userId: string;
  description: string;
  amountInCents: AmountInCents;
  kind: TransactionKind;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  categoryId: string;
  accountId?: string;
  creditCardId?: string;
  occurredAt: Date;
  dueAt?: Date;
};

export function validateTransaction(
  input: CreateTransactionInput,
): CreateTransactionInput {
  if (!input.userId) {
    throw new BusinessError(
      "TRANSACTION_USER_REQUIRED",
      "O lançamento precisa pertencer a um usuário.",
    );
  }

  if (!input.description.trim()) {
    throw new BusinessError(
      "TRANSACTION_DESCRIPTION_REQUIRED",
      "A descrição do lançamento é obrigatória.",
    );
  }

  if (!input.categoryId) {
    throw new BusinessError(
      "TRANSACTION_CATEGORY_REQUIRED",
      "A categoria do lançamento é obrigatória.",
    );
  }

  assertPositiveAmountInCents(input.amountInCents);

  if (Number.isNaN(input.occurredAt.getTime())) {
    throw new BusinessError(
      "INVALID_TRANSACTION_DATE",
      "A data do lançamento é inválida.",
    );
  }

  if (input.dueAt && Number.isNaN(input.dueAt.getTime())) {
    throw new BusinessError(
      "INVALID_DUE_DATE",
      "A data de vencimento é inválida.",
    );
  }

  if (input.paymentMethod === "CREDIT_CARD") {
    if (input.kind !== "EXPENSE") {
      throw new BusinessError(
        "CREDIT_CARD_INCOME_NOT_ALLOWED",
        "Recebimentos não podem usar cartão de crédito.",
      );
    }

    if (!input.creditCardId) {
      throw new BusinessError(
        "CREDIT_CARD_REQUIRED",
        "Uma compra no crédito precisa indicar o cartão.",
      );
    }

    if (input.accountId) {
      throw new BusinessError(
        "CREDIT_CARD_ACCOUNT_NOT_ALLOWED",
        "Uma compra no crédito não movimenta uma conta diretamente.",
      );
    }
  } else if (!input.accountId) {
    throw new BusinessError(
      "TRANSACTION_ACCOUNT_REQUIRED",
      "O lançamento precisa indicar a conta movimentada.",
    );
  } else if (input.creditCardId) {
    throw new BusinessError(
      "CREDIT_CARD_NOT_ALLOWED",
      "Somente compras no crédito podem indicar um cartão.",
    );
  }

  return {
    ...input,
    description: input.description.trim(),
  };
}

export function transactionAffectsAccountBalance(
  transaction: Pick<CreateTransactionInput, "status" | "paymentMethod">,
): boolean {
  return (
    transaction.status === "SETTLED" &&
    transaction.paymentMethod !== "CREDIT_CARD"
  );
}
