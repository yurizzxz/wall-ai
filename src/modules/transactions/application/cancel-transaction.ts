import type { TransactionRecord } from "./create-transaction";
import { BusinessError } from "../../shared/application/business-error";

export type CancelTransactionInput = {
  userId: string;
  transactionId: string;
};

export type CancelTransactionDependencies = {
  transactions: {
    findById(userId: string, transactionId: string): Promise<TransactionRecord | null>;
    cancel(input: CancelTransactionInput): Promise<TransactionRecord>;
  };
};

export async function cancelTransaction(
  input: CancelTransactionInput,
  dependencies: CancelTransactionDependencies,
): Promise<TransactionRecord> {
  const transaction = await dependencies.transactions.findById(
    input.userId,
    input.transactionId,
  );

  if (!transaction) {
    throw new BusinessError(
      "TRANSACTION_NOT_FOUND",
      "Lançamento não encontrado para esse usuário.",
    );
  }

  if (transaction.status === "CANCELLED") {
    throw new BusinessError("TRANSACTION_ALREADY_CANCELLED", "O lançamento já está cancelado.");
  }

  return dependencies.transactions.cancel(input);
}
