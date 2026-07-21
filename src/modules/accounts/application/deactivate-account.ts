import type { AmountInCents } from "@/modules/shared/domain/money";
import type { Account } from "../domain/account";

export type DeactivateAccountInput = {
  userId: string;
  accountId: string;
};

export type AccountWithBalance = {
  account: Account;
  balanceInCents: AmountInCents;
};

export type DeactivateAccountErrorCode =
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_ALREADY_INACTIVE"
  | "ACCOUNT_HAS_BALANCE"
  | "ACCOUNT_HAS_PENDING_TRANSACTIONS";

export class DeactivateAccountError extends Error {
  constructor(public readonly code: DeactivateAccountErrorCode) {
    super(code);
    this.name = "DeactivateAccountError";
  }
}

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
    throw new DeactivateAccountError("ACCOUNT_NOT_FOUND");
  }

  if (!result.account.isActive) {
    throw new DeactivateAccountError("ACCOUNT_ALREADY_INACTIVE");
  }

  if (result.balanceInCents !== 0) {
    throw new DeactivateAccountError("ACCOUNT_HAS_BALANCE");
  }

  if (
    await dependencies.accounts.hasPendingTransactions(
      input.userId,
      input.accountId,
    )
  ) {
    throw new DeactivateAccountError("ACCOUNT_HAS_PENDING_TRANSACTIONS");
  }

  return dependencies.accounts.setActive(input.userId, input.accountId, false);
}
