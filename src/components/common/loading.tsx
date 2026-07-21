import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full flex-col gap-8 py-6 sm:py-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-8 w-28 sm:block" />
      </header>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y px-0">
          {[0, 1, 2].map((group) => (
            <section key={group} className="px-4 py-5 sm:px-6">
              <div className="flex gap-3">
                <Skeleton className="size-8 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
