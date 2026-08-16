/**
 * Consistent empty state for pages when no data is available.
 */

import type { LucideIcon } from "lucide-react";
import { PageWrapper } from "./PageWrapper";

interface PageEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
}

export function PageEmptyState({
  icon: Icon,
  title = "Sem dados",
  description = "Nenhum documento encontrado neste período",
}: PageEmptyStateProps) {
  return (
    <PageWrapper>
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          {Icon && (
            <div className="mb-4 inline-block rounded-full bg-muted p-3">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </PageWrapper>
  );
}
