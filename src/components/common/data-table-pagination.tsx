"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Props = {
  currentPage: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
};

export function DataTablePagination({
  currentPage,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-sm text-muted-foreground">
        {from}–{to} de {total} resultados
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => goTo(1)}
          disabled={currentPage <= 1}
          aria-label="Ir para a primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Ir para a página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="px-3 text-sm">
          {currentPage} / {pageCount}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= pageCount}
          aria-label="Ir para a próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => goTo(pageCount)}
          disabled={currentPage >= pageCount}
          aria-label="Ir para a última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
