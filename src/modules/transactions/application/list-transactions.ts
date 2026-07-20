import type { TransactionRecord } from "./create-transaction";
import type { TransactionKind, TransactionStatus } from "../domain/transaction";

export type ListTransactionsInput = {
  userId: string;
  page: number;
  pageSize: number;
  kind?: TransactionKind;
  status?: TransactionStatus;
  from?: Date;
  to?: Date;
};

export type TransactionListItem = TransactionRecord & {
  notes?: string;
  settledAt?: Date;
  categoryName: string;
  accountName?: string;
  creditCardName?: string;
};

export type TransactionPage = {
  items: TransactionListItem[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type ListTransactionsRepository = {
  listPage(input: ListTransactionsInput): Promise<TransactionPage>;
};

export async function listTransactions(
  input: ListTransactionsInput,
  repository: ListTransactionsRepository,
): Promise<TransactionPage> {
  if (!input.userId) {
    throw new Error("Usuário não autenticado.");
  }

  if (!Number.isInteger(input.page) || input.page < 1) {
    throw new Error("A página deve ser um inteiro positivo.");
  }

  if (!Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 100) {
    throw new Error("A página deve conter entre 1 e 100 lançamentos.");
  }

  if (input.from && Number.isNaN(input.from.getTime())) {
    throw new Error("A data inicial é inválida.");
  }

  if (input.to && Number.isNaN(input.to.getTime())) {
    throw new Error("A data final é inválida.");
  }

  if (input.from && input.to && input.from > input.to) {
    throw new Error("A data inicial não pode vir depois da data final.");
  }

  return repository.listPage(input);
}
