import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="relative shrink-0 border-b border-border/75 bg-card/45 px-8 pt-5 pb-5">
      <div className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-accent text-accent-foreground shadow-sm">
          <Icon className="size-[19px]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="mb-1 text-[25px] font-semibold tracking-[-0.035em]">{title}</h1>
          <p className="mb-0 max-w-[760px] text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
