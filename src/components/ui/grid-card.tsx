import React from "react";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

const pattern: [number, number][] = [
  [7, 1],
  [8, 3],
  [10, 2],
  [9, 5],
  [11, 4],
];

export function GridCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group relative isolate z-0 flex h-full flex-col justify-between overflow-hidden rounded-sm border bg-background px-5 py-4 transition-colors duration-150 hover:border-primary/30",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute -inset-[25%] -skew-y-12 [mask-image:linear-gradient(225deg,black,transparent)]">
          <GridPattern
            width={30}
            height={30}
            squares={pattern}
            className="absolute inset-0 size-full translate-y-2 transition-transform duration-150 ease-out group-hover:translate-y-0"
          />
        </div>
        <div className="absolute -inset-[10%] bg-[conic-gradient(#0f766e_0deg,#0f766e_110deg,#d97706_180deg,#2563eb_260deg,#0f766e_360deg)] opacity-0 blur-3xl transition-opacity duration-150 group-hover:opacity-10" />
      </div>
      {children}
    </div>
  );
}
