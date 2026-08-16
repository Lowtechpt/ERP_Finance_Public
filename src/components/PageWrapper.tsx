/**
 * Page wrapper with consistent background and spacing.
 * All pages should be wrapped in this component.
 */

import { memo, type ReactNode } from "react";

// No max-width and no centring: this is an operational dashboard, so it uses
// the full usable width of the viewport.
export const PageWrapper = memo(function PageWrapper({ children }: { children: ReactNode }) {
  return <div className="w-full bg-page px-5 py-5 lg:px-6">{children}</div>;
});
