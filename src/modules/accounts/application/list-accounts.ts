import type { AmountInCents } from "../../shared/domain/money";
import type { Account } from "../domain/account";

export type AccountListItem = Account & {
  currency: string;
  balanceInCents: AmountInCents;
};

export type ListAccountsRepository = {
  listWithBalance(userId: string): Promise<AccountListItem[]>;
};

export async function listAccounts(
  userId: string,
  repository: ListAccountsRepository,
): Promise<AccountListItem[]> {
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  return repository.listWithBalance(userId);
}
