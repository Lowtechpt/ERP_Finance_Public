/**
 * Reusable metric display components.
 * Pure presentational components with no internal state or API calls.
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

export const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const style = {
    Vencido: "bg-danger-soft text-danger",
    Parcial: "bg-warning-soft text-warning",
    Pendente: "bg-info-soft text-info",
  }[status];

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", style)}>
      {status}
    </span>
  );
});

export const MetricCard = memo(function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) {
  return (
    <div className="card-elevated p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</p>
    </div>
  );
});

export const MetricLine = memo(function MetricLine({ label, value, tone }: { label: string; value: string; tone: "default" | "success" | "danger" }) {
  return (
    <div className="card-elevated flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</span>
    </div>
  );
});

export const MetricMini = memo(function MetricMini({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) {
  return (
    <div className="card-elevated p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-semibold tabular-nums", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</p>
    </div>
  );
});

export const SimpleBar = memo(function SimpleBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "success" | "danger" }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className={cn("font-semibold", tone === "success" ? "text-success" : "text-danger")}>{formatCurrency(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-muted">
        <div className={cn("h-3 rounded-full", tone === "success" ? "bg-success" : "bg-danger")} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
});

export const Activity = memo(function Activity({
  icon: Icon,
  title,
  body,
  warning,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  warning?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-1 grid size-6 shrink-0 place-items-center rounded-full",
          warning ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 leading-5 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
});

export const TabButton = memo(function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
});

export const TabGroup = memo(function TabGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 rounded-xl bg-muted p-1 overflow-x-auto", className)}>
      {children}
    </div>
  );
});
