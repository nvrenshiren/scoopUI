import { Check, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '../locales';

export type BucketTabValue = 'added' | 'known';

export interface BucketTabsProps {
  value: BucketTabValue;
  onChange: (next: BucketTabValue) => void;
  addedCount: number;
  knownCount: number;
  className?: string;
}

export function BucketTabs({ value, onChange, addedCount, knownCount, className }: BucketTabsProps) {
  const t = useT();

  return (
    <div
      role="tablist"
      aria-label="buckets"
      className={cn(
        'h-10 border-b border-border bg-bg-elevated flex items-center gap-1 px-6',
        className,
      )}
    >
      <BucketTabTrigger
        active={value === 'added'}
        onClick={() => onChange('added')}
        icon={<Check className="h-3.5 w-3.5" />}
        label={t('tabs.added')}
        count={addedCount}
        countTone="primary"
        aria-controls="panel-added"
      />
      <BucketTabTrigger
        active={value === 'known'}
        onClick={() => onChange('known')}
        icon={<Layers className="h-3.5 w-3.5" />}
        label={t('tabs.known')}
        count={knownCount}
        countTone="muted"
        aria-controls="panel-known"
      />
    </div>
  );
}

interface BucketTabTriggerProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  countTone: 'primary' | 'muted';
  'aria-controls'?: string;
}

function BucketTabTrigger({
  active,
  onClick,
  icon,
  label,
  count,
  countTone,
  ...rest
}: BucketTabTriggerProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-10 items-center gap-2 px-4 text-sm font-medium transition-colors',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        active ? 'text-primary' : 'text-fg-muted hover:text-fg',
      )}
      {...rest}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none font-mono',
          countTone === 'primary' ? 'bg-primary/15 text-primary' : 'bg-bg-overlay text-fg-muted',
        )}
      >
        {count}
      </span>
      {active && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-primary"
          style={{ boxShadow: '0 1px 8px var(--primary-glow)' }}
        />
      )}
    </button>
  );
}