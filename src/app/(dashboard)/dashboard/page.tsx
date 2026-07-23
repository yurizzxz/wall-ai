import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { DashboardChartsSection } from "@/app/(dashboard)/dashboard/_components/dashboard-charts-section";
import { DashboardCommitments } from "@/app/(dashboard)/dashboard/_components/dashboard-commitments";
import { DashboardIndicators } from "@/app/(dashboard)/dashboard/_components/dashboard-indicators";
import {
  DashboardChartsSkeleton,
  DashboardCommitmentsSkeleton,
  DashboardIndicatorsSkeleton,
} from "@/app/(dashboard)/dashboard/_components/dashboard-section-skeletons";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Acompanhe o resumo da sua vida financeira.",
};

async function getDashboardPeriods() {
  await connection();
  const now = new Date();

  return {
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    trendStart: new Date(now.getFullYear(), now.getMonth() - 5, 1),
  };
}

export default async function DashboardPage() {
  const periods = await getDashboardPeriods();

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

      <Suspense fallback={<DashboardIndicatorsSkeleton />}>
        <DashboardIndicators
          periodStart={periods.periodStart}
          periodEnd={periods.periodEnd}
        />
      </Suspense>

      <Suspense fallback={<DashboardChartsSkeleton />}>
        <DashboardChartsSection {...periods} />
      </Suspense>

      <Suspense fallback={<DashboardCommitmentsSkeleton />}>
        <DashboardCommitments />
      </Suspense>
    </div>
  );
}
