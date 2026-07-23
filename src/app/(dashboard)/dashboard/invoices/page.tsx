import { ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { InvoicesTable } from "@/app/(dashboard)/dashboard/invoices/_components/invoices-table";
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
import { listInvoices } from "@/modules/invoices/application/list-invoices";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

export const metadata: Metadata = {
  title: "Faturas",
  description: "Acompanhe fechamentos, vencimentos e pagamentos dos cartões.",
};

async function getRequestTimestamp() {
  await connection();
  return Date.now();
}

export default async function InvoicesPage() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const [invoices, accounts, categories, nowTimestamp] = await Promise.all([
    listInvoices({ userId: session.user.id }, repositories.invoices),
    listAccounts(session.user.id, repositories.accounts),
    listCategories(session.user.id, repositories.categories),
    getRequestTimestamp(),
  ]);
  const activeAccounts = accounts
    .filter((account) => account.isActive)
    .map(({ id, name, balanceInCents }) => ({ id, name, balanceInCents }));
  const expenseCategories = categories
    .filter(
      (category) =>
        category.isActive &&
        (category.kind === "EXPENSE" || category.kind === "BOTH"),
    )
    .map(({ id, name }) => ({ id, name }));
  const pendingInvoices = invoices.filter((invoice) => invoice.status !== "PAID");
  const nextInvoice = pendingInvoices.find(
    (invoice) => invoice.dueAt.getTime() >= nowTimestamp,
  );
  const nextInvoiceInCents = nextInvoice?.outstandingInCents ?? 0;
  const outstandingInCents = pendingInvoices.reduce(
    (total, invoice) => total + invoice.outstandingInCents,
    0,
  );
  const overdueInCents = invoices
    .filter((invoice) => invoice.status === "OVERDUE")
    .reduce((total, invoice) => total + invoice.outstandingInCents, 0);
  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Crédito</p>
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          Faturas
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Acompanhe fechamentos, vencimentos e pagamentos dos seus cartões.
        </p>
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <CardTitle>Resumo das faturas</CardTitle>
          <CardDescription>Valores que precisam de acompanhamento</CardDescription>
        </CardHeader>
        <CardContent className="grid divide-y px-0 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Próxima fatura</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(nextInvoiceInCents)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Total a pagar</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(outstandingInCents)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Em atraso</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-destructive">
              {formatCurrency(overdueInCents)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Faturas pendentes</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {pendingInvoices.length}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ReceiptText className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Suas faturas</CardTitle>
              <CardDescription>
                {invoices.length === 1 ? "1 fatura encontrada" : `${invoices.length} faturas encontradas`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {invoices.length > 0 ? (
            <InvoicesTable
              invoices={invoices}
              nowTimestamp={nowTimestamp}
              accounts={activeAccounts}
              categories={expenseCategories}
            />
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ReceiptText className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">Nenhuma fatura encontrada</h2>
              <p className="mt-1 max-w-sm text-xs/relaxed text-muted-foreground">
                As faturas aparecerão aqui conforme seus cartões receberem lançamentos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
