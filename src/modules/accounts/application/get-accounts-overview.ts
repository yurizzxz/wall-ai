import type { AmountInCents } from "../../shared/domain/money";
import type {
  AccountListItem,
  ListAccountsRepository,
} from "./list-accounts";

export type AccountsOverview = {
  accounts: AccountListItem[];
  activeAccountCount: number;
  accountCount: number;
  savingsAccountCount: number;
  accountBalanceInCents: AmountInCents;
  savingsBalanceInCents: AmountInCents;
  netWorthInCents: AmountInCents;
};

export type AccountsOverviewDependencies = {
  accounts: ListAccountsRepository;
};

export async function getAccountsOverview(
  userId: string,
  dependencies: AccountsOverviewDependencies,
): Promise<AccountsOverview> {
  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  const accounts = await dependencies.accounts.listWithBalance(userId);
  const activeAccounts = accounts.filter((account) => account.isActive);
  const savingsAccounts = activeAccounts.filter(
    (account) => account.type === "SAVINGS",
  );
  const regularAccounts = activeAccounts.filter(
    (account) => account.type !== "SAVINGS",
  );
  const savingsBalanceInCents = savingsAccounts.reduce(
    (total, account) => total + account.balanceInCents,
    0,
  );
  const accountBalanceInCents = regularAccounts.reduce(
    (total, account) => total + account.balanceInCents,
    0,
  );
  const netWorthInCents = activeAccounts.reduce(
    (total, account) => total + account.balanceInCents,
    0,
  );

  return {
    accounts,
    activeAccountCount: activeAccounts.length,
    accountCount: regularAccounts.length,
    savingsAccountCount: savingsAccounts.length,
    accountBalanceInCents,
    savingsBalanceInCents,
    netWorthInCents,
  };
}
