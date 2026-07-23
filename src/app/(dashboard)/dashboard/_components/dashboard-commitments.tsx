import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getDashboardCommitments } from "@/modules/dashboard/application/get-dashboard-summary";
import { createRepositories } from "@/services/repositories";
import { requireSession } from "@/services/users/require-session";

export async function DashboardCommitments() {
  const session = await requireSession();
  const repositories = createRepositories(session.user.id);
  const commitments = await getDashboardCommitments(
    session.user.id,
    repositories.dashboard,
  );
  const items = [
    {
      label: "Faturas em aberto",
      value: commitments.openInvoicesInCents,
      href: "/dashboard/invoices",
      badge: "A pagar",
    },
    {
      label: "Dívidas pendentes",
      value: commitments.pendingDebtsInCents,
      href: "/dashboard/debts",
      badge: "Acompanhar",
    },
    {
      label: "Guardado em metas",
      value: commitments.savedInCents,
      href: "/dashboard/savings-goals",
      badge: "Reserva",
    },
  ];

  return (
    <section aria-labelledby="commitments-title">
      <Card>
        <CardHeader className="border-b">
          <CardTitle id="commitments-title">Compromissos e reservas</CardTitle>
          <CardDescription>
            Valores acumulados que merecem acompanhamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y px-0">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted sm:px-6"
            >
              <span className="min-w-0 flex-1 text-sm font-medium">
                {item.label}
              </span>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {item.badge}
              </Badge>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(item.value)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
