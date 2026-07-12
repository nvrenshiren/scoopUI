import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, right, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4 border-b border-border px-6 py-5', className)}>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
