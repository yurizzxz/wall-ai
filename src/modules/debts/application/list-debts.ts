import type { Debt, DebtStatus } from "../domain/debt";
import type { AmountInCents } from "../../shared/domain/money";

export type DebtListItem = Debt & {
  outstandingInCents: AmountInCents;
};

export type ListDebtsInput = {
  userId: string;
  status?: DebtStatus;
};

export type ListDebtsRepository = {
  listForUser(input: ListDebtsInput): Promise<DebtListItem[]>;
};

export async function listDebts(
  input: ListDebtsInput,
  repository: ListDebtsRepository,
): Promise<DebtListItem[]> {
  if (!input.userId) {
    throw new Error("Usuário não autenticado.");
  }

  return repository.listForUser(input);
}
