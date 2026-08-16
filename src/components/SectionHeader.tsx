/**
 * Consistent section header with category, title, and description.
 * Used at the top of each page.
 */

import { memo } from "react";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  category?: string;
  categoryIcon?: LucideIcon;
  title: string;
  description?: string;
}

export const SectionHeader = memo(function SectionHeader({ category, categoryIcon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-5">
      {category && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {category}
        </p>
      )}
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
    </div>
  );
});
