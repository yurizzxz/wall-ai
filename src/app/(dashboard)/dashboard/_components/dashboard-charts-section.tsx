import { DashboardCharts } from "@/components/common/dashboard-charts";
import {
  getDashboardCharts,
  type DashboardCashFlowPoint,
} from "@/modules/dashboard/application/get-dashboard-summary";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

type DashboardChartsSectionProps = {
  periodStart: Date;
  periodEnd: Date;
  trendStart: Date;
};

function fillCashFlowMonths(
  points: DashboardCashFlowPoint[],
  trendStart: Date,
  periodEnd: Date,
) {
  const pointsByMonth = new Map(points.map((point) => [point.month, point]));
  const months: DashboardCashFlowPoint[] = [];
  const cursor = new Date(trendStart);

  while (cursor < periodEnd) {
    const month = `${cursor.getFullYear()}-${String(
      cursor.getMonth() + 1,
    ).padStart(2, "0")}`;
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

export async function DashboardChartsSection({
  periodStart,
  periodEnd,
  trendStart,
}: DashboardChartsSectionProps) {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const charts = await getDashboardCharts(
    { userId: session.user.id, periodStart, periodEnd, trendStart },
    repositories.dashboard,
  );

  return (
    <DashboardCharts
      cashFlow={fillCashFlowMonths(charts.cashFlow, trendStart, periodEnd)}
      expensesByCategory={charts.expensesByCategory}
    />
  );
}
