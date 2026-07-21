import { RefreshCcw } from "lucide-react";

import { CreateRecurrenceDialog } from "@/app/(dashboard)/dashboard/recurrences/_components/create-recurrence-dialog";
import { RecurrencesTable } from "@/app/(dashboard)/dashboard/recurrences/_components/recurrences-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAccounts } from "@/modules/accounts/application/list-accounts";
import { listCategories } from "@/modules/categories/application/list-categories";
import { listCreditCards } from "@/modules/credit-cards/application/list-credit-cards";
import { listRecurrences } from "@/modules/recurrences/application/list-recurrences";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";
import { connection } from "next/server";

async function getRequestTimestamp() {
  await connection();
  return Date.now();
}

export default async function RecurrencesPage() {
  const session = await requireSession();
  const nowTimestamp = await getRequestTimestamp();
  
  const repositories = createRepositories(session.user.id);
  const [recurrences, accounts, creditCards, categories] = await Promise.all([
    listRecurrences({ userId: session.user.id }, repositories.recurrences),
    listAccounts(session.user.id, repositories.accounts),
    listCreditCards(session.user.id, repositories.creditCards),
    listCategories(session.user.id, repositories.categories),
  ]);
  const activeAccounts = accounts
    .filter((account) => account.isActive)
    .map(({ id, name }) => ({ id, name }));
  const activeCreditCards = creditCards
    .filter((creditCard) => creditCard.isActive)
    .map(({ id, name }) => ({ id, name }));
  const activeCategories = categories
    .filter((category) => category.isActive)
    .map(({ id, name, kind }) => ({ id, name, kind }));
    
  const activeRecurrences = recurrences.filter((recurrence) => recurrence.isActive);
  const dueRecurrences = activeRecurrences.filter(
    (recurrence) =>
      recurrence.nextOccurrenceAt.getTime() <= nowTimestamp &&
      (!recurrence.endsAt || recurrence.endsAt.getTime() >= nowTimestamp),
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Automação</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Recorrências
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Programe movimentações repetidas e mantenha seus lançamentos em dia.
          </p>
        </div>
        <CreateRecurrenceDialog
          accounts={activeAccounts}
          creditCards={activeCreditCards}
          categories={activeCategories}
        />
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <CardTitle>Resumo das recorrências</CardTitle>
          <CardDescription>Automações cadastradas e prontas para processar</CardDescription>
        </CardHeader>
        <CardContent className="grid px-0 sm:grid-cols-3 sm:divide-x">
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Ativas</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {activeRecurrences.length}
            </p>
          </div>
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Aguardando processamento</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-primary">
              {dueRecurrences.length}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Inativas</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {recurrences.length - activeRecurrences.length}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <RefreshCcw className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Suas recorrências</CardTitle>
              <CardDescription>
                {recurrences.length === 1
                  ? "1 recorrência cadastrada"
                  : `${recurrences.length} recorrências cadastradas`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {recurrences.length > 0 ? (
            <RecurrencesTable rows={recurrences} nowTimestamp={nowTimestamp} />
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <RefreshCcw className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">Nenhuma recorrência cadastrada</h2>
              <p className="mt-1 max-w-sm text-xs/relaxed text-muted-foreground">
                Crie uma automação para repetir receitas ou despesas com menos esforço.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
