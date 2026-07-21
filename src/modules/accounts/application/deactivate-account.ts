import { BusinessError } from "../../shared/application/business-error";
import type { AmountInCents } from "../../shared/domain/money";
import type { Account } from "../domain/account";

export type DeactivateAccountInput = {
  userId: string;
  accountId: string;
};

export type AccountWithBalance = {
  account: Account;
  balanceInCents: AmountInCents;
};

export type DeactivateAccountDependencies = {
  accounts: {
    findByIdWithBalance(
      userId: string,
      accountId: string,
    ): Promise<AccountWithBalance | null>;
    hasPendingTransactions(userId: string, accountId: string): Promise<boolean>;
    setActive(
      userId: string,
      accountId: string,
      isActive: boolean,
    ): Promise<Account>;
  };
};

export async function deactivateAccount(
  input: DeactivateAccountInput,
  dependencies: DeactivateAccountDependencies,
): Promise<Account> {
  const result = await dependencies.accounts.findByIdWithBalance(
    input.userId,
    input.accountId,
  );

  if (!result) {
    throw new BusinessError("ACCOUNT_NOT_FOUND", "Conta não encontrada.");
  }

  if (!result.account.isActive) {
    throw new BusinessError("ACCOUNT_ALREADY_INACTIVE", "Esta conta já está inativa.");
  }

  if (result.balanceInCents !== 0) {
    throw new BusinessError(
      "ACCOUNT_HAS_BALANCE",
      "Transfira ou zere o saldo antes de desativar a conta.",
    );
  }

  if (
    await dependencies.accounts.hasPendingTransactions(
      input.userId,
      input.accountId,
    )
  ) {
    throw new BusinessError(
      "ACCOUNT_HAS_PENDING_TRANSACTIONS",
      "Resolva os lançamentos pendentes antes de desativar a conta.",
    );
  }

  return dependencies.accounts.setActive(input.userId, input.accountId, false);
}
