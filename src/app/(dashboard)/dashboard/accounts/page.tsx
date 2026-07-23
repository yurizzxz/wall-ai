import { Wallet, WalletCards } from "lucide-react";
import type { Metadata } from "next";

import { AccountsTable } from "@/app/(dashboard)/dashboard/accounts/_components/accounts-table";
import { CreateAccountDialog } from "@/app/(dashboard)/dashboard/accounts/_components/create-account-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { listAccounts } from "@/modules/accounts/application/list-accounts";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

export const metadata: Metadata = {
  title: "Contas",
  description: "Gerencie suas contas e acompanhe seus saldos.",
};

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
            <AccountsTable accounts={accounts} />
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
