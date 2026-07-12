import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type StateHeroTone = 'info' | 'error';

export interface StateHeroAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: ButtonProps['variant'];
  disabled?: boolean;
}

export interface StateHeroProps {
  title: string;
  description: string;
  icon: ReactNode;
  illustration: ReactNode;
  tone?: StateHeroTone;
  badge?: string;
  label?: string;
  scope?: string;
  actions?: StateHeroAction[];
  children?: ReactNode;
  className?: string;
}

export function StateHero({
  title,
  description,
  icon,
  illustration,
  tone = 'info',
  badge,
  label,
  scope,
  actions,
  children,
  className,
}: StateHeroProps) {
  const isError = tone === 'error';

  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center rounded-lg border bg-bg-elevated p-6 text-center shadow-[var(--shadow-md)]',
        isError ? 'border-destructive/25' : 'border-border',
        className,
      )}
    >
      {(badge || label || scope) && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {badge && (
            <Badge
              variant={isError ? 'destructive' : 'default'}
              className="font-mono text-[11px] tracking-wide"
            >
              {badge}
            </Badge>
          )}
          {label && <span className="font-display text-xs font-semibold text-fg">{label}</span>}
          {scope && <span className="font-mono text-[11px] text-fg-subtle">/ {scope}</span>}
        </div>
      )}

      <div
        aria-hidden="true"
        className={cn(
          'relative mb-4 grid h-28 w-28 place-items-center overflow-hidden rounded-lg border bg-bg',
          isError
            ? 'border-destructive/25 shadow-[inset_0_0_34px_rgba(239,68,68,0.12),0_0_24px_rgba(239,68,68,0.10)]'
            : 'border-primary/20 shadow-[inset_0_0_34px_rgba(34,197,94,0.08),0_0_24px_rgba(34,197,94,0.08)]',
        )}
      >
        <div className="absolute inset-3 text-fg-subtle/55 [&_svg]:h-full [&_svg]:w-full [&_svg]:stroke-current">
          {illustration}
        </div>
        <div
          className={cn(
            'relative z-10 [&_svg]:h-11 [&_svg]:w-11 [&_svg]:stroke-[1.5]',
            isError
              ? 'text-destructive drop-shadow-[0_0_12px_var(--destructive-glow)]'
              : 'text-primary drop-shadow-[0_0_12px_var(--primary-glow)]',
          )}
        >
          {icon}
        </div>
      </div>

      <h2 className="font-display text-[17px] font-semibold leading-tight tracking-tight text-fg">
        {title}
      </h2>
      <p className="mt-2 max-w-[360px] text-[13.5px] leading-relaxed text-fg-muted">
        {description}
      </p>

      {actions && actions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <HeroAction key={`${action.label}-${action.variant ?? 'default'}`} action={action} />
          ))}
        </div>
      )}

      {children && <div className="mt-4 w-full max-w-[420px]">{children}</div>}
    </div>
  );
}

function HeroAction({ action }: { action: StateHeroAction }) {
  const content = (
    <>
      {action.icon && <span className="[&_svg]:h-4 [&_svg]:w-4">{action.icon}</span>}
      <span>{action.label}</span>
    </>
  );

  if (action.href && !action.disabled) {
    return (
      <Button variant={action.variant} size="sm" asChild>
        <a href={action.href} onClick={action.onClick}>
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={action.variant}
      size="sm"
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {content}
    </Button>
  );
}
