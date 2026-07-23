import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardListPageSkeletonProps = {
  hasAction?: boolean;
  summaryItems?: 0 | 2 | 3 | 4;
  tableRows?: number;
};

const summaryGridClasses = {
  2: "sm:grid-cols-3",
  3: "sm:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

function PageHeaderSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {hasAction ? <Skeleton className="h-8 w-32" /> : null}
    </div>
  );
}

function SummarySkeleton({ items }: { items: 2 | 3 | 4 }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-2 border-b py-4 sm:px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </CardHeader>
      <CardContent
        className={cn(
          "grid divide-y px-0",
          summaryGridClasses[items],
          items === 4
            ? "lg:divide-x lg:divide-y-0"
            : "sm:divide-x sm:divide-y-0",
        )}
      >
        {Array.from({ length: items }, (_, index) => (
          <div
            key={index}
            className={cn(
              "space-y-2 px-4 py-4 sm:px-6",
              items === 2 && index === 0 && "sm:col-span-2",
            )}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex min-h-13 items-center gap-4 border-b px-4 py-3 last:border-b-0 sm:px-6"
          >
            <Skeleton className="size-8 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32 sm:w-44" />
              <Skeleton className="h-3 w-24 sm:w-36" />
            </div>
            <Skeleton className="hidden h-4 w-24 sm:block" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardListPageSkeleton({
  hasAction = true,
  summaryItems = 3,
  tableRows = 6,
}: DashboardListPageSkeletonProps) {
  return (
    <div
      className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8"
      aria-label="Carregando página"
      aria-busy="true"
    >
      <PageHeaderSkeleton hasAction={hasAction} />
      {summaryItems ? <SummarySkeleton items={summaryItems} /> : null}
      <TableSkeleton rows={tableRows} />
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div
      className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8"
      aria-label="Carregando visão geral"
      aria-busy="true"
    >
      <PageHeaderSkeleton />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2 border-b">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <TableSkeleton rows={3} />
    </div>
  );
}
