/**
 * Consistent loading state for pages.
 * Shows spinner and message while data is being fetched.
 */

import { PageWrapper } from "./PageWrapper";

interface PageLoadingStateProps {
  message?: string;
}

export function PageLoadingState({ message = "A carregar dados..." }: PageLoadingStateProps) {
  return (
    <PageWrapper>
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-info"></div>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </PageWrapper>
  );
}
