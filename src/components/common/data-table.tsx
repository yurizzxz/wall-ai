"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];
  rightColumn?: boolean;
  containerClassName?: string;
  cellClassName?: string;
  currentPage?: number;
  pageCount?: number;
  total?: number;
  pageSize?: number;
  getRowClassName?: (row: TData) => string | undefined;
};

export function DataTable<TData>({
  data,
  columns,
  rightColumn,
  containerClassName,
  cellClassName,
  currentPage = 1,
  pageCount,
  total,
  pageSize = Math.max(data.length, 1),
  getRowClassName,
}: DataTableProps<TData>) {
  const [localPageIndex, setLocalPageIndex] = useState(0);
  const hasServerPagination = pageCount !== undefined && total !== undefined;
  const localPageCount = Math.max(Math.ceil(data.length / pageSize), 1);
  const safeLocalPageIndex = Math.min(localPageIndex, localPageCount - 1);
  const resolvedCurrentPage = hasServerPagination
    ? currentPage
    : safeLocalPageIndex + 1;
  const resolvedPageCount = hasServerPagination ? pageCount : localPageCount;
  const resolvedTotal = hasServerPagination ? total : data.length;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: hasServerPagination,
    pageCount: resolvedPageCount,
    state: {
      pagination: {
        pageIndex: hasServerPagination
          ? resolvedCurrentPage - 1
          : safeLocalPageIndex,
        pageSize,
      },
    },
  });

  return (
    <div
      className={cn(
        (hasServerPagination || data.length > pageSize) && "space-y-4",
      )}
    >
      <div className={cn("overflow-hidden rounded-lg border", containerClassName)}>
        <Table>
          <TableHeader className="bg-card">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header, index) => {
                  const isLast = rightColumn && index === group.headers.length - 1;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        index === 0 && "pl-4 sm:pl-6",
                        index === group.headers.length - 1 && "pr-4 sm:pr-6",
                        isLast && "text-right",
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={getRowClassName?.(row.original)}
              >
                {row.getVisibleCells().map((cell, index) => {
                  const isLast = rightColumn && index === row.getVisibleCells().length - 1;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "h-13",
                        index === 0 && "pl-4 sm:pl-6",
                        index === row.getVisibleCells().length - 1 && "pr-4 sm:pr-6",
                        isLast && "text-right",
                        cellClassName,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasServerPagination || data.length > pageSize ? (
        <DataTablePagination
          currentPage={resolvedCurrentPage}
          pageCount={resolvedPageCount}
          total={resolvedTotal}
          pageSize={pageSize}
          onPageChange={
            hasServerPagination
              ? undefined
              : (page) => setLocalPageIndex(page - 1)
          }
        />
      ) : null}
    </div>
  );
}
