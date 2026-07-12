import { Ban, CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import type { InstallJobState } from '../../../../../shared/ipc-contract';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { JobActionType } from '../store/job-dialog-store';
import type { P08Copy } from '../locales';
import { operationTitle, stateLabel } from '../locales';
import { getStateTone, toneClassNames } from './ColorVariant';

interface ProgressHeaderProps {
  jobId: string;
  target: string;
  source?: string;
  action: JobActionType;
  state: InstallJobState;
  copy: P08Copy;
  onClose: () => void;
}

function StatusIcon({ state }: { state: InstallJobState }) {
  if (state === 'succeeded') return <CheckCircle2 className="h-5 w-5" aria-hidden />;
  if (state === 'failed') return <XCircle className="h-5 w-5" aria-hidden />;
  if (state === 'cancelled') return <Ban className="h-5 w-5" aria-hidden />;
  return <Loader2 className="h-5 w-5 animate-spin" aria-hidden />;
}

export function ProgressHeader({
  jobId,
  target,
  source,
  action,
  state,
  copy,
  onClose,
}: ProgressHeaderProps) {
  const tone = getStateTone(state);
  const displayTarget = target || copy.labels.unknownTarget;
  const shortJobId = jobId.length > 12 ? `${jobId.slice(0, 8)}...` : jobId;

  return (
    <header className="relative border-b border-border px-6 pt-5 pb-4">
      <div className="flex items-start gap-4 pr-12">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneClassNames[tone].icon)}>
          <StatusIcon state={state} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold leading-tight text-fg">
              {operationTitle(copy, action, state)} ·{' '}
              <span className={cn('font-mono', toneClassNames[tone].text)}>{displayTarget}</span>
            </h2>
            <Badge className={cn('border', toneClassNames[tone].badge)}>{stateLabel(copy, state)}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-fg-muted">
            {copy.labels.target}: <span className="font-mono text-fg">{displayTarget}</span>
            <span className="px-1.5 text-fg-subtle">·</span>
            {copy.labels.source}: <span className="font-mono text-fg">{source || copy.labels.unknownSource}</span>
            <span className="px-1.5 text-fg-subtle">·</span>
            {copy.labels.jobId}=<span className="font-mono text-fg-subtle">{shortJobId}</span>
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 text-fg-muted hover:text-fg"
        aria-label={copy.actions.close}
        onClick={onClose}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </header>
  );
}
