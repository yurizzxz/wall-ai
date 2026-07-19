import {
  assertCategoryAcceptsTransaction,
  type Category,
} from "../../categories/domain/category";
import type { TransactionRecord } from "./create-transaction";

export type UpdateTransactionInput = {
  userId: string;
  transactionId: string;
  description: string;
  categoryId: string;
};

export type UpdateTransactionDependencies = {
  transactions: {
    findById(userId: string, transactionId: string): Promise<TransactionRecord | null>;
    updateMetadata(input: UpdateTransactionInput): Promise<TransactionRecord>;
  };
  categories: {
    findById(userId: string, categoryId: string): Promise<Category | null>;
  };
};

export async function updateTransaction(
  rawInput: UpdateTransactionInput,
  dependencies: UpdateTransactionDependencies,
): Promise<TransactionRecord> {
  const input = { ...rawInput, description: rawInput.description.trim() };

  if (!input.description) {
    throw new Error("A descrição do lançamento é obrigatória.");
  }

  const [transaction, category] = await Promise.all([
    dependencies.transactions.findById(input.userId, input.transactionId),
    dependencies.categories.findById(input.userId, input.categoryId),
  ]);

  if (!transaction) {
    throw new Error("Lançamento não encontrado para esse usuário.");
  }

  if (transaction.status === "CANCELLED") {
    throw new Error("Um lançamento cancelado não pode ser editado.");
  }

  if (!category) {
    throw new Error("Categoria não encontrada para esse usuário.");
  }

  assertCategoryAcceptsTransaction(category, transaction.kind);
  return dependencies.transactions.updateMetadata(input);
}
