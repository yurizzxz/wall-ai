import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardIndicatorsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"
      aria-label="Carregando indicadores"
      aria-busy="true"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Card
          key={index}
          className={cn(index === 0 && "sm:col-span-2 xl:col-span-2")}
        >
          <CardHeader className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-36 max-w-full" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function DashboardChartsSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-12"
      aria-label="Carregando gráficos"
      aria-busy="true"
    >
      {[7, 5].map((span) => (
        <Card key={span} className={cn(span === 7 ? "lg:col-span-7" : "lg:col-span-5")}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardCommitmentsSkeleton() {
  return (
    <Card aria-label="Carregando compromissos" aria-busy="true">
      <CardHeader className="space-y-2 border-b">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </CardHeader>
      <CardContent className="divide-y px-0">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-6"
          >
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-5 w-20 sm:block" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
