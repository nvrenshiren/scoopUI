// P10 · 空状态/错误状态(作为 P03/P04/P05/P06 的子状态呈现)
import type { ComponentType, ReactNode } from "react";
import { Package, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  hint,
  error,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  error?: boolean;
  children?: ReactNode;
}) {
  const Glyph = Icon ?? (error ? TriangleAlert : Package);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div
        className={cn(
          "mb-1 flex size-14 items-center justify-center rounded-lg border",
          error
            ? "border-warning/30 bg-[var(--warning-soft)] text-warning"
            : "border-border bg-secondary text-subtle",
        )}
      >
        <Glyph className="size-7" />
      </div>
      <div className="text-[15px] font-medium">{title}</div>
      {hint && <div className="max-w-[480px] text-[13px] text-muted-foreground">{hint}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
