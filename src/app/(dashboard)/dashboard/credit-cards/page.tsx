import { CreditCard, WalletCards } from "lucide-react";

import { CreateCreditCardDialog } from "@/app/(dashboard)/dashboard/credit-cards/_components/create-credit-card-dialog";
import { DeactivateCreditCardDialog } from "@/app/(dashboard)/dashboard/credit-cards/_components/deactivate-credit-card-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { listCreditCards } from "@/modules/credit-cards/application/list-credit-cards";
import type { CreditCardListItem } from "@/modules/credit-cards/application/list-credit-cards";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

type CreditCardRowProps = {
  card: CreditCardListItem;
};

function CreditCardRow({ card }: CreditCardRowProps) {
  const usagePercentage = Math.min(
    100,
    Math.max(0, (card.committedInCents / card.limitInCents) * 100),
  );

  return (
    <li className="px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
            aria-hidden="true"
          >
            <CreditCard className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-medium">{card.name}</h2>
              {!card.isActive ? <Badge variant="outline">Inativo</Badge> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {card.lastFour ? `Final ${card.lastFour} · ` : ""}
              Fecha dia {card.closingDay} · Vence dia {card.dueDay}
            </p>
          </div>
        </div>

        <div className="pl-12 lg:w-64 lg:pl-0">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Limite utilizado</span>
            <span className="font-mono font-medium tabular-nums">
              {formatCurrency(card.committedInCents)}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Uso do limite de ${card.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(usagePercentage)}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            de {formatCurrency(card.limitInCents)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 pl-12 lg:min-w-44 lg:justify-end lg:pl-0">
          <div className="lg:text-right">
            <p className="font-mono text-sm font-semibold tabular-nums">
              {formatCurrency(card.availableInCents)}
            </p>
            <p className="text-xs text-muted-foreground">Disponível</p>
          </div>
          {card.isActive ? (
            <DeactivateCreditCardDialog cardId={card.id} cardName={card.name} />
          ) : (
            <span className="w-7" aria-hidden="true" />
          )}
        </div>
      </div>
    </li>
  );
}

export default async function CreditCardsPage() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const cards = await listCreditCards(session.user.id, repositories.creditCards);
  const activeCards = cards.filter((card) => card.isActive);
  const totals = activeCards.reduce(
    (result, card) => ({
      limit: result.limit + card.limitInCents,
      committed: result.committed + card.committedInCents,
      available: result.available + card.availableInCents,
    }),
    { limit: 0, committed: 0, available: 0 },
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Crédito</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Cartões
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Veja seus limites e acompanhe quanto já está comprometido.
          </p>
        </div>
        <CreateCreditCardDialog />
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <CardTitle>Limite consolidado</CardTitle>
          <CardDescription>Soma dos cartões ativos</CardDescription>
        </CardHeader>
        <CardContent className="grid px-0 sm:grid-cols-3 sm:divide-x">
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(totals.available)}
            </p>
          </div>
          <div className="border-b px-4 py-4 sm:border-b-0 sm:px-6">
            <p className="text-xs text-muted-foreground">Comprometido</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(totals.committed)}
            </p>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">Limite total</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
              {formatCurrency(totals.limit)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <WalletCards className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Seus cartões</CardTitle>
              <CardDescription>
                {cards.length === 1 ? "1 cartão cadastrado" : `${cards.length} cartões cadastrados`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {cards.length > 0 ? (
            <ul className="divide-y" aria-label="Cartões cadastrados">
              {cards.map((card) => (
                <CreditCardRow key={card.id} card={card} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <CreditCard className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">Cadastre seu primeiro cartão</h2>
              <p className="mt-1 max-w-sm text-xs/relaxed text-muted-foreground">
                Adicione limite e datas da fatura para acompanhar seus gastos com crédito.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
