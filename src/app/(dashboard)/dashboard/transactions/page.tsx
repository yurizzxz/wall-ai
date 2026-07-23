import { ArrowDownRight, ArrowUpRight, ListFilter, ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateTransactionDialog } from "@/app/(dashboard)/dashboard/transactions/_components/create-transaction-dialog";
import { TransactionFilters } from "@/app/(dashboard)/dashboard/transactions/_components/transaction-filters";
import { TransactionsTable } from "@/app/(dashboard)/dashboard/transactions/_components/transactions-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { listAccounts } from "@/modules/accounts/application/list-accounts";
import { listCategories } from "@/modules/categories/application/list-categories";
import { listCreditCards } from "@/modules/credit-cards/application/list-credit-cards";
import { listTransactions } from "@/modules/transactions/application/list-transactions";
import type {
  TransactionKind,
  TransactionStatus,
} from "@/modules/transactions/domain/transaction";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

export const metadata: Metadata = {
  title: "Lançamentos",
  description: "Consulte e gerencie suas receitas e despesas.",
};

const PAGE_SIZE = 10;
const TRANSACTION_KINDS = new Set<TransactionKind>(["INCOME", "EXPENSE"]);
const TRANSACTION_STATUSES = new Set<TransactionStatus>([
  "PENDING",
  "SETTLED",
  "CANCELLED",
]);

type TransactionsPageProps = {
  searchParams: Promise<{
    page?: string;
    kind?: string;
    status?: string;
  }>;
};

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseKind(value?: string): TransactionKind | undefined {
  return value && TRANSACTION_KINDS.has(value as TransactionKind)
    ? (value as TransactionKind)
    : undefined;
}

function parseStatus(value?: string): TransactionStatus | undefined {
  return value && TRANSACTION_STATUSES.has(value as TransactionStatus)
    ? (value as TransactionStatus)
    : undefined;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const params = await searchParams;
  const page = parsePage(params.page);
  const kind = parseKind(params.kind);
  const status = parseStatus(params.status);
  const [transactions, accounts, creditCards, categories] = await Promise.all([
    listTransactions(
      { userId: session.user.id, page, pageSize: PAGE_SIZE, kind, status },
      repositories.transactions,
    ),
    listAccounts(session.user.id, repositories.accounts),
    listCreditCards(session.user.id, repositories.creditCards),
    listCategories(session.user.id, repositories.categories),
  ]);
  if (transactions.total > 0 && page > transactions.pageCount) {
    const targetParams = new URLSearchParams();
    targetParams.set("page", String(transactions.pageCount));
    if (kind) targetParams.set("kind", kind);
    if (status) targetParams.set("status", status);
    redirect(`/dashboard/transactions?${targetParams.toString()}`);
  }
  const activeAccounts = accounts
    .filter((account) => account.isActive)
    .map(({ id, name, balanceInCents }) => ({ id, name, balanceInCents }));
  const activeCreditCards = creditCards
    .filter((creditCard) => creditCard.isActive)
    .map(({ id, name, availableInCents }) => ({ id, name, availableInCents }));
  const activeCategories = categories
    .filter((category) => category.isActive)
    .map(({ id, name, kind: categoryKind }) => ({ id, name, kind: categoryKind }));
  const settledItems = transactions.items.filter(
    (transaction) => transaction.status === "SETTLED",
  );
  const incomeInCents = settledItems
    .filter((transaction) => transaction.kind === "INCOME")
    .reduce((total, transaction) => total + transaction.amountInCents, 0);
  const expenseInCents = settledItems
    .filter((transaction) => transaction.kind === "EXPENSE")
    .reduce((total, transaction) => total + transaction.amountInCents, 0);

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Movimentações</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Lançamentos
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Consulte receitas e despesas e mantenha seus registros organizados.
          </p>
        </div>
        <CreateTransactionDialog
          accounts={activeAccounts}
          creditCards={activeCreditCards}
          categories={activeCategories}
        />
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <CardTitle>Resumo da página</CardTitle>
          <CardDescription>Valores liquidados nos resultados visíveis</CardDescription>
        </CardHeader>
        <CardContent className="grid px-0 sm:grid-cols-3 sm:divide-x">
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Resultados encontrados</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {transactions.total}
            </p>
          </div>
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpRight className="size-3" aria-hidden="true" />
              Receitas nesta página
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-emerald-600">
              {formatCurrency(incomeInCents)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownRight className="size-3" aria-hidden="true" />
              Despesas nesta página
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-destructive">
              {formatCurrency(expenseInCents)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ReceiptText className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Seus lançamentos</CardTitle>
                <CardDescription>Histórico financeiro paginado</CardDescription>
              </div>
            </div>
            <TransactionFilters kind={kind} status={status} />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {transactions.items.length > 0 ? (
            <TransactionsTable
              transactions={transactions.items}
              categories={activeCategories}
              currentPage={transactions.page}
              pageCount={transactions.pageCount}
              pageSize={transactions.pageSize}
              total={transactions.total}
            />
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {kind || status ? (
                  <ListFilter className="size-5" aria-hidden="true" />
                ) : (
                  <ReceiptText className="size-5" aria-hidden="true" />
                )}
              </span>
              <h2 className="mt-4 text-sm font-semibold">
                {kind || status ? "Nenhum resultado encontrado" : "Nenhum lançamento cadastrado"}
              </h2>
              <p className="mt-1 max-w-sm text-xs/relaxed text-muted-foreground">
                {kind || status
                  ? "Ajuste os filtros para consultar outros lançamentos."
                  : "Registre uma receita ou despesa para iniciar seu histórico."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
