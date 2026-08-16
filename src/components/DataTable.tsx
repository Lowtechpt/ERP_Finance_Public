/**
 * Reusable data table component with sorting, responsive columns, and hover states.
 */

import { memo } from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  sortable?: boolean;
  hidden?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sortBy?: keyof T;
  sortOrder?: "asc" | "desc";
  onSort?: (sortBy: keyof T, sortOrder: "asc" | "desc") => void;
  rowClassName?: string;
  onRowClick?: (row: T) => void;
  summary?: React.ReactNode;
}

function DataTableInner<T extends Record<string, any>>({
  columns,
  data,
  sortBy,
  sortOrder = "asc",
  onSort,
  rowClassName,
  onRowClick,
  summary,
}: DataTableProps<T>) {
  const visibleColumns = columns.filter((col) => !col.hidden);

  const handleSort = (key: keyof T) => {
    const isCurrentSort = sortBy === key;
    const newOrder = isCurrentSort && sortOrder === "asc" ? "desc" : "asc";
    onSort?.(key, newOrder);
  };

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {visibleColumns.map((col) => (
                <th
                  key={String(col.accessorKey)}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.accessorKey)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.header}
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Sem dados para exibir
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    onRowClick && "cursor-pointer",
                    rowClassName,
                  )}
                >
                  {visibleColumns.map((col) => (
                    <td key={String(col.accessorKey)} className="px-4 py-3 text-sm text-foreground">
                      {col.render ? col.render(row[col.accessorKey], row) : row[col.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {summary && (
        <div className="border-t border-border bg-muted/50 px-4 py-3">
          {summary}
        </div>
      )}
    </div>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
