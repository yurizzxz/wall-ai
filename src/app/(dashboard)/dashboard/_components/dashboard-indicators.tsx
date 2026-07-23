import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  Scale,
} from "lucide-react";

import { DashboardKpiCard } from "@/components/common/dashboard-kpi-card";
import { formatCurrency } from "@/lib/formatters";
import { getDashboardIndicators } from "@/modules/dashboard/application/get-dashboard-summary";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

type DashboardIndicatorsProps = {
  periodStart: Date;
  periodEnd: Date;
};

export async function DashboardIndicators({
  periodStart,
  periodEnd,
}: DashboardIndicatorsProps) {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const indicators = await getDashboardIndicators(
    { userId: session.user.id, periodStart, periodEnd },
    repositories.dashboard,
  );
  const monthlyResult =
    indicators.monthlyIncomeInCents - indicators.monthlyExpenseInCents;

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"
      aria-label="Indicadores financeiros"
    >
      <div className="sm:col-span-2 xl:col-span-2">
        <DashboardKpiCard
          label="Saldo disponível"
          value={formatCurrency(indicators.totalBalanceInCents)}
          description="Soma das contas ativas"
          icon={CircleDollarSign}
          featured
        />
      </div>
      <DashboardKpiCard
        label="Receitas"
        value={formatCurrency(indicators.monthlyIncomeInCents)}
        description="Liquidadas neste mês"
        icon={ArrowUpRight}
        valueTone="positive"
      />
      <DashboardKpiCard
        label="Despesas"
        value={formatCurrency(indicators.monthlyExpenseInCents)}
        description="Liquidadas neste mês"
        icon={ArrowDownRight}
        valueTone="negative"
      />
      <DashboardKpiCard
        label="Resultado mensal"
        value={formatCurrency(monthlyResult)}
        description={
          monthlyResult >= 0
            ? "Mês fechando no positivo"
            : "Despesas acima das receitas"
        }
        icon={Scale}
        valueTone={monthlyResult >= 0 ? "positive" : "negative"}
      />
      <DashboardKpiCard
        label="Pendências"
        value={String(indicators.pendingTransactionCount)}
        description="Lançamentos aguardando baixa"
        icon={Clock3}
      />
    </section>
  );
}
