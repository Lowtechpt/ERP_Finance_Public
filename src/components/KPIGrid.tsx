/**
 * Consistent KPI grid for displaying key metrics.
 * Uses 5-column layout on desktop, responsive on smaller screens.
 */

import { memo } from "react";
import { cn } from "@/lib/utils";

export interface KPIItem {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "danger" | "warning" | "info";
  subtext?: string;
}

interface KPIGridProps {
  items: KPIItem[];
  className?: string;
}

const toneClasses = {
  default: "text-foreground",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

export const KPIGrid = memo(function KPIGrid({ items, className }: KPIGridProps) {
  return (
    <div className={cn("grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]", className)}>
      {items.map((item) => (
        <div key={item.label} className="card-elevated px-3.5 py-3">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className={cn("mt-1 text-lg font-semibold tabular-nums", toneClasses[item.tone ?? "default"])}>
            {item.value}
          </p>
          {item.subtext && <p className="mt-0.5 text-[11px] text-muted-foreground">{item.subtext}</p>}
        </div>
      ))}
    </div>
  );
});
