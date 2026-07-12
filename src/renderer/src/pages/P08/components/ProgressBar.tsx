import type { InstallJobState } from '../../../../../shared/ipc-contract';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getStateTone, toneClassNames } from './ColorVariant';

interface ProgressBarProps {
  value?: number;
  state: InstallJobState;
  className?: string;
}

export function ProgressBar({ value, state, className }: ProgressBarProps) {
  const tone = getStateTone(state);
  const indeterminate = typeof value !== 'number' && (state === 'queued' || state === 'running');
  const bounded = typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div className={cn('relative overflow-hidden rounded-full', className)}>
      <Progress
        value={indeterminate ? 0 : bounded}
        className={cn('h-2 bg-bg-overlay', toneClassNames[tone].progress)}
      />
      {indeterminate ? (
        <div
          aria-hidden="true"
          className="glow-primary absolute top-0 left-0 h-2 w-1/3 animate-pulse rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
        />
      ) : null}
    </div>
  );
}
