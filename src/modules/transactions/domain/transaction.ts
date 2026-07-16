import {
  assertPositiveAmountInCents,
  type AmountInCents,
} from "@/modules/shared/domain/money";

export type TransactionKind = "INCOME" | "EXPENSE";
export type TransactionStatus = "PENDING" | "SETTLED" | "CANCELLED";
export type PaymentMethod =
  | "CASH"
  | "PIX"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "CREDIT_CARD";

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
    throw new Error("O lançamento precisa pertencer a um usuário.");
  }

  if (!input.description.trim()) {
    throw new Error("A descrição do lançamento é obrigatória.");
  }

  if (!input.categoryId) {
    throw new Error("A categoria do lançamento é obrigatória.");
  }

  assertPositiveAmountInCents(input.amountInCents);

  if (Number.isNaN(input.occurredAt.getTime())) {
    throw new Error("A data do lançamento é inválida.");
  }

  if (input.dueAt && Number.isNaN(input.dueAt.getTime())) {
    throw new Error("A data de vencimento é inválida.");
  }

  if (input.paymentMethod === "CREDIT_CARD") {
    if (input.kind !== "EXPENSE") {
      throw new Error("Recebimentos não podem usar cartão de crédito.");
    }

    if (!input.creditCardId) {
      throw new Error("Uma compra no crédito precisa indicar o cartão.");
    }
  } else if (!input.accountId) {
    throw new Error("O lançamento precisa indicar a conta movimentada.");
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
