import { useState } from 'react';
import { Ban, FileText, RefreshCw } from 'lucide-react';
import type { InstallJobState } from '../../../../../shared/ipc-contract';
import { Button } from '@/components/ui/button';
import type { P08Copy } from '../locales';

interface ActionButtonsProps {
  state: InstallJobState;
  canCancel: boolean;
  canRetry: boolean;
  copy: P08Copy;
  onCancel: () => void | Promise<void>;
  onClose: () => void;
  onRetry: () => void | Promise<void>;
  onViewLog: () => void | Promise<void>;
}

export function ActionButtons({
  state,
  canCancel,
  canRetry,
  copy,
  onCancel,
  onClose,
  onRetry,
  onViewLog,
}: ActionButtonsProps) {
  const [busy, setBusy] = useState<'cancel' | 'retry' | 'log' | null>(null);

  const run = (next: 'cancel' | 'retry' | 'log', fn: () => void | Promise<void>) => () => {
    if (busy) return;
    setBusy(next);
    Promise.resolve(fn()).finally(() => setBusy(null));
  };

  const terminal = state === 'succeeded' || state === 'failed' || state === 'cancelled';

  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
      <span className="text-xs text-fg-subtle">
        {terminal ? copy.messages.succeeded : copy.messages.running}
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <Button type="button" variant="secondary" onClick={run('log', onViewLog)} disabled={busy !== null}>
          <FileText className="h-3.5 w-3.5" aria-hidden />
          {copy.actions.viewFullLog}
        </Button>
        {canCancel ? (
          <Button
            type="button"
            variant="destructive"
            onClick={run('cancel', onCancel)}
            disabled={busy !== null}
          >
            <Ban className="h-3.5 w-3.5" aria-hidden />
            {copy.actions.cancel}
          </Button>
        ) : null}
        {state === 'failed' ? (
          <Button
            type="button"
            className="glow-primary"
            onClick={run('retry', onRetry)}
            disabled={busy !== null || !canRetry}
            title={canRetry ? undefined : copy.messages.retryUnavailable}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {copy.actions.retry}
          </Button>
        ) : null}
        {!canCancel && state !== 'failed' ? (
          <Button type="button" onClick={onClose} className="glow-primary">
            {state === 'succeeded' ? copy.actions.done : copy.actions.close}
          </Button>
        ) : null}
        {canCancel ? (
          <Button type="button" variant="outline" onClick={onClose} disabled={busy !== null}>
            {copy.actions.runInBackground}
          </Button>
        ) : null}
      </div>
    </footer>
  );
}
