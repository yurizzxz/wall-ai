"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters";
import type {
  DashboardCashFlowPoint,
  DashboardCategoryExpense,
} from "@/modules/dashboard/application/get-dashboard-summary";

type DashboardChartsProps = {
  cashFlow: DashboardCashFlowPoint[];
  expensesByCategory: DashboardCategoryExpense[];
};

const cashFlowConfig = {
  incomeInCents: { label: "Receitas", color: "var(--chart-1)" },
  expenseInCents: { label: "Despesas", color: "var(--chart-2)" },
} satisfies ChartConfig;

const categoryConfig = {
  totalInCents: { label: "Despesas", color: "var(--chart-2)" },
} satisfies ChartConfig;

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(year, monthNumber - 1, 1))
    .replace(".", "");
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-md bg-muted/40 px-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function DashboardCharts({ cashFlow, expensesByCategory }: DashboardChartsProps) {
  const categoryData = expensesByCategory.slice(0, 5);
  const hasCashFlow = cashFlow.some(
    (point) => point.incomeInCents > 0 || point.expenseInCents > 0,
  );

  return (
    <section className="grid gap-4 lg:grid-cols-12" aria-label="Análises financeiras">
      <Card className="lg:col-span-7">
        <CardHeader>
          <CardTitle>Fluxo de caixa</CardTitle>
          <CardDescription>Receitas e despesas liquidadas nos últimos seis meses.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasCashFlow ? (
            <EmptyChart>Registre uma transação liquidada para acompanhar sua evolução.</EmptyChart>
          ) : (
            <ChartContainer config={cashFlowConfig} className="h-64 w-full aspect-auto">
              <BarChart data={cashFlow} accessibilityLayer margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickFormatter={formatMonth} tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value: number) => formatCompactCurrency(value)}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value, name) => (
                    <div className="flex min-w-40 items-center justify-between gap-4">
                      <span className="text-muted-foreground">{cashFlowConfig[name as keyof typeof cashFlowConfig]?.label}</span>
                      <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                    </div>
                  )} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="incomeInCents" fill="var(--color-incomeInCents)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenseInCents" fill="var(--color-expenseInCents)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-5">
        <CardHeader>
          <CardTitle>Despesas por categoria</CardTitle>
          <CardDescription>Maiores destinos do seu dinheiro neste mês.</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <EmptyChart>Suas categorias aparecerão aqui após a primeira despesa liquidada.</EmptyChart>
          ) : (
            <ChartContainer config={categoryConfig} className="h-64 w-full aspect-auto">
              <BarChart data={categoryData} layout="vertical" accessibilityLayer margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={92}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={<ChartTooltipContent hideLabel formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                  )} />}
                />
                <Bar dataKey="totalInCents" fill="var(--color-totalInCents)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
