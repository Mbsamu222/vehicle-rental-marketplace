import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { EmptyState } from "./Feedback";
import { SkeletonCard } from "./Feedback";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyFor,
  isLoading,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  keyFor: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border dark:border-dark-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-primary-50/60 dark:border-dark-border dark:bg-white/5">
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3 font-semibold text-primary-500 dark:text-primary-200">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyFor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-border last:border-0 dark:border-dark-border",
                onRowClick && "cursor-pointer hover:bg-primary-50/60 dark:hover:bg-white/5",
              )}
            >
              {columns.map((col) => (
                <td key={col.header} className={cn("px-4 py-3.5 text-primary dark:text-white", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
