import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Clock3, Plus, Scale } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { DashboardCharts } from "@/components/common/dashboard-charts";
import { DashboardKpiCard } from "@/components/common/dashboard-kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getDashboardSummary } from "@/modules/dashboard/application/get-dashboard-summary";
import type { DashboardCashFlowPoint } from "@/modules/dashboard/application/get-dashboard-summary";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Acompanhe o resumo da sua vida financeira.",
};

function getDashboardPeriods() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  return { periodStart, periodEnd, trendStart };
}

function fillCashFlowMonths(
  points: DashboardCashFlowPoint[],
  trendStart: Date,
  periodEnd: Date,
) {
  const pointsByMonth = new Map(points.map((point) => [point.month, point]));
  const months: DashboardCashFlowPoint[] = [];
  const cursor = new Date(trendStart);

  while (cursor < periodEnd) {
    const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    months.push(
      pointsByMonth.get(month) ?? {
        month,
        incomeInCents: 0,
        expenseInCents: 0,
      },
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const periods = getDashboardPeriods();
  const summary = await getDashboardSummary(
    { userId: session.user.id, ...periods },
    repositories.dashboard,
  );
  const monthlyResult = summary.monthlyIncomeInCents - summary.monthlyExpenseInCents;
  const cashFlow = fillCashFlowMonths(summary.cashFlow, periods.trendStart, periods.periodEnd);

  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Visão geral</p>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            Seu dinheiro, com clareza
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Acompanhe o mês atual e identifique o que precisa da sua atenção.
          </p>
        </div>
        <Button size="lg" render={<Link href="/dashboard/transactions" />}>
          <Plus aria-hidden="true" />
          Novo lançamento
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores financeiros">
        <div className="sm:col-span-2 xl:col-span-2">
          <DashboardKpiCard
            label="Saldo disponível"
            value={formatCurrency(summary.totalBalanceInCents)}
            description="Soma das contas ativas"
            icon={CircleDollarSign}
            featured
          />
        </div>
        <DashboardKpiCard
          label="Receitas"
          value={formatCurrency(summary.monthlyIncomeInCents)}
          description="Liquidadas neste mês"
          icon={ArrowUpRight}
          valueTone="positive"
        />
        <DashboardKpiCard
          label="Despesas"
          value={formatCurrency(summary.monthlyExpenseInCents)}
          description="Liquidadas neste mês"
          icon={ArrowDownRight}
          valueTone="negative"
        />
        <DashboardKpiCard
          label="Resultado mensal"
          value={formatCurrency(monthlyResult)}
          description={monthlyResult >= 0 ? "Mês fechando no positivo" : "Despesas acima das receitas"}
          icon={Scale}
          valueTone={monthlyResult >= 0 ? "positive" : "negative"}
        />
        <DashboardKpiCard
          label="Pendências"
          value={String(summary.pendingTransactionCount)}
          description="Lançamentos aguardando baixa"
          icon={Clock3}
        />
      </section>

      <DashboardCharts cashFlow={cashFlow} expensesByCategory={summary.expensesByCategory} />

      <section aria-labelledby="commitments-title">
        <Card>
          <CardHeader className="border-b">
            <CardTitle id="commitments-title">Compromissos e reservas</CardTitle>
            <CardDescription>Valores acumulados que merecem acompanhamento.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y px-0">
            {[
              { label: "Faturas em aberto", value: summary.openInvoicesInCents, href: "/dashboard/invoices", badge: "A pagar" },
              { label: "Dívidas pendentes", value: summary.pendingDebtsInCents, href: "/dashboard/debts", badge: "Acompanhar" },
              { label: "Guardado em metas", value: summary.savedInCents, href: "/dashboard/savings-goals", badge: "Reserva" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted sm:px-6"
              >
                <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                <Badge variant="secondary" className="hidden sm:inline-flex">{item.badge}</Badge>
                <span className="font-mono text-sm font-semibold tabular-nums">{formatCurrency(item.value)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
