import type { ComponentType, ReactNode } from "react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="relative isolate shrink-0 overflow-hidden border-b border-border/70 bg-card/20 px-7 pt-5 pb-4">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-45" />
      <div className="bg-glow-top pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex items-center gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card/80 text-primary shadow-sm">
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="mb-1 text-[23px] font-semibold tracking-[-0.025em]">{title}</h1>
          <p className="mb-0 max-w-[720px] text-[13px] leading-5 text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="relative flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
