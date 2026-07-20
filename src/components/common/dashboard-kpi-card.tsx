import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardKpiCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  featured?: boolean;
  valueTone?: "default" | "positive" | "negative";
};

export function DashboardKpiCard({
  label,
  value,
  description,
  icon: Icon,
  featured = false,
  valueTone = "default",
}: DashboardKpiCardProps) {
  return (
    <Card className={cn(featured && "h-full bg-primary text-primary-foreground ring-0")}>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className={cn("text-muted-foreground", featured && "text-primary-foreground/80")}>
          {label}
        </CardTitle>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground",
            featured && "bg-primary-foreground/10 text-primary-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <p
          className={cn(
            "font-heading text-2xl font-semibold tracking-[-0.02em] tabular-nums sm:text-3xl",
            valueTone === "positive" && !featured && "text-emerald-600 dark:text-emerald-400",
            valueTone === "negative" && !featured && "text-orange-600 dark:text-orange-400",
          )}
        >
          {value}
        </p>
        <p className={cn("text-xs text-muted-foreground", featured && "text-primary-foreground/70")}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
