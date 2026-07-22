import { Landmark, PiggyBank, Scale } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type AccountSummaryCardsProps = {
  accountCount: number;
  savingsAccountCount: number;
  accountBalanceInCents: number;
  savingsBalanceInCents: number;
  netWorthInCents: number;
};

const summaries = [
  { key: "accounts", label: "Saldo em contas", icon: Landmark },
  { key: "savings", label: "Saldo dos cofrinhos", icon: PiggyBank },
  { key: "netWorth", label: "Patrimônio total", icon: Scale },
] as const;

export function AccountSummaryCards({
  accountCount,
  savingsAccountCount,
  accountBalanceInCents,
  savingsBalanceInCents,
  netWorthInCents,
}: AccountSummaryCardsProps) {
  const values = {
    accounts: accountBalanceInCents,
    savings: savingsBalanceInCents,
    netWorth: netWorthInCents,
  };
  const descriptions = {
    accounts:
      accountCount === 1
        ? "Saldo de 1 conta ativa"
        : `Soma de ${accountCount} contas ativas`,
    savings:
      savingsAccountCount === 1
        ? "1 cofrinho ativo"
        : `${savingsAccountCount} cofrinhos ativos`,
    netWorth: "Todas as contas ativas",
  };

  return (
    <section aria-label="Resumo das contas">
      <Card className="gap-0 py-0">
        <CardContent className="grid px-0 sm:grid-cols-3 sm:divide-x">
          {summaries.map(({ key, label, icon: Icon }, index) => (
            <div
              key={key}
              className={cn(
                "px-4 py-4 sm:px-6",
                index < summaries.length - 1 &&
                  "border-b sm:border-b-0",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums sm:text-2xl">
                {formatCurrency(values[key])}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {descriptions[key]}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
