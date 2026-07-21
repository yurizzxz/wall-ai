import {
  Banknote,
  ChartNoAxesCombined,
  Landmark,
  PiggyBank,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { CreateAccountDialog } from "@/app/(dashboard)/dashboard/accounts/_components/create-account-dialog";
import { DeactivateAccountDialog } from "@/app/(dashboard)/dashboard/accounts/_components/deactivate-account-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { listAccounts } from "@/modules/accounts/application/list-accounts";
import type { AccountListItem } from "@/modules/accounts/application/list-accounts";
import type { AccountType } from "@/modules/accounts/domain/account";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

const ACCOUNT_TYPE_DETAILS = {
  CHECKING: { label: "Conta corrente", icon: Landmark },
  SAVINGS: { label: "Poupança", icon: PiggyBank },
  CASH: { label: "Dinheiro", icon: Banknote },
  INVESTMENT: { label: "Investimentos", icon: ChartNoAxesCombined },
} satisfies Record<AccountType, { label: string; icon: LucideIcon }>;

type AccountRowProps = {
  account: AccountListItem;
};

function AccountRow({ account }: AccountRowProps) {
  const { icon: Icon, label } = ACCOUNT_TYPE_DETAILS[account.type];

  return (
    <li className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-medium">{account.name}</h2>
            {!account.isActive ? <Badge variant="outline">Inativa</Badge> : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pl-12 sm:justify-end sm:pl-0">
        <div className="text-left sm:min-w-36 sm:text-right">
          <p className="font-mono text-sm font-semibold tabular-nums">
            {formatCurrency(account.balanceInCents)}
          </p>
          <p className="text-xs text-muted-foreground">Saldo atual</p>
        </div>
        {account.isActive ? (
          <DeactivateAccountDialog accountId={account.id} accountName={account.name} />
        ) : (
          <span className="w-7" aria-hidden="true" />
        )}
      </div>
    </li>
  );
}

export default async function AccountsPage() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const accounts = await listAccounts(session.user.id, repositories.accounts);
  const activeAccounts = accounts.filter((account) => account.isActive);
  const activeBalanceInCents = activeAccounts.reduce(
    (total, account) => total + account.balanceInCents,
    0,
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Organização financeira</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Contas
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Acompanhe onde seu dinheiro está e mantenha os saldos organizados.
          </p>
        </div>
        <CreateAccountDialog />
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo das contas">
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardDescription>Saldo disponível</CardDescription>
            <CardTitle className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
              {formatCurrency(activeBalanceInCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="size-3.5" aria-hidden="true" />
            Soma das contas ativas
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Contas ativas</CardDescription>
            <CardTitle className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
              {activeAccounts.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {accounts.length - activeAccounts.length} inativa(s)
          </CardContent>
        </Card>
      </section>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <WalletCards className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Suas contas</CardTitle>
              <CardDescription>
                {accounts.length === 1
                  ? "1 conta cadastrada"
                  : `${accounts.length} contas cadastradas`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {accounts.length > 0 ? (
            <ul className="divide-y" aria-label="Contas cadastradas">
              {accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <WalletCards className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">Cadastre sua primeira conta</h2>
              <p className="mt-1 max-w-sm text-xs/relaxed text-muted-foreground">
                Adicione a conta que você mais usa para começar a acompanhar seu saldo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
