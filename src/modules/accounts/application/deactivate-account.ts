import type { Account } from "../domain/account";

export type DeactivateAccountInput = {
  userId: string;
  accountId: string;
};

export type DeactivateAccountDependencies = {
  accounts: {
    findById(userId: string, accountId: string): Promise<Account | null>;
    hasPendingTransactions(userId: string, accountId: string): Promise<boolean>;
    setActive(userId: string, accountId: string, isActive: boolean): Promise<Account>;
  };
};

export async function deactivateAccount(
  input: DeactivateAccountInput,
  dependencies: DeactivateAccountDependencies,
): Promise<Account> {
  const account = await dependencies.accounts.findById(
    input.userId,
    input.accountId,
  );

  if (!account) {
    throw new Error("Conta não encontrada para esse usuário.");
  }

  if (!account.isActive) {
    throw new Error("A conta já está inativa.");
  }

  if (
    await dependencies.accounts.hasPendingTransactions(
      input.userId,
      input.accountId,
    )
  ) {
    throw new Error("A conta possui lançamentos pendentes.");
  }

  return dependencies.accounts.setActive(input.userId, input.accountId, false);
}
