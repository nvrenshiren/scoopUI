import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJobDialogStore, type JobActionType } from './store/job-dialog-store';
import { useJobProgress } from './hooks/use-job-progress';
import { pickLocale, stageLabel } from './locales';
import { ProgressHeader } from './components/ProgressHeader';
import { ProgressBar } from './components/ProgressBar';
import { LogStream } from './components/LogStream';
import { ActionButtons } from './components/ActionButtons';
import { ColorVariant, getStateTone, toneClassNames } from './components/ColorVariant';

export interface P08Props {
  open?: boolean;
  jobId?: string | null;
  channel?: string;
  target?: string;
  source?: string;
  action?: JobActionType;
  className?: string;
  onClose?: () => void;
  onRetry?: () => void | Promise<void>;
  onViewLog?: (content: string, jobId: string) => void | Promise<void>;
}

function openLogSnapshot(content: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function P08({
  open,
  jobId,
  channel,
  target,
  source,
  action,
  className,
  onClose,
  onRetry,
  onViewLog,
}: P08Props) {
  const { i18n } = useTranslation();
  const copy = pickLocale(i18n.language);
  const activeJobId = useJobDialogStore((state) => state.activeJobId);
  const activeJob = useJobDialogStore((state) => state.activeJob);
  const closeJob = useJobDialogStore((state) => state.closeJob);
  const resolvedJobId = jobId ?? activeJob?.jobId ?? activeJobId;
  const visible = open ?? Boolean(resolvedJobId);
  const { progress, cancelJob, retryJob } = useJobProgress({
    jobId: resolvedJobId,
    channel: channel ?? activeJob?.channel,
    target: target ?? activeJob?.target,
    source: source ?? activeJob?.source,
    action: action ?? activeJob?.action,
  });

  if (!visible || !resolvedJobId) return null;

  const tone = getStateTone(progress.state);
  const displayPercent = typeof progress.percent === 'number' ? `${Math.round(progress.percent)}%` : '...';
  const logContent = progress.logs.map((line) => line.text).join('\n') || copy.labels.noLog;
  const retryHandler = onRetry ?? activeJob?.onRetry;

  const handleClose = (): void => {
    closeJob();
    onClose?.();
  };

  const handleCancel = async (): Promise<void> => {
    await cancelJob();
  };

  const handleViewLog = async (): Promise<void> => {
    if (onViewLog) {
      await onViewLog(logContent, resolvedJobId);
      return;
    }
    if (activeJob?.onViewLog) {
      await activeJob.onViewLog(resolvedJobId);
      return;
    }
    openLogSnapshot(logContent);
  };

  const handleRetry = async (): Promise<void> => {
    if (retryHandler) {
      await retryHandler();
      return;
    }
    await retryJob();
  };

  const statusMessage =
    progress.state === 'failed'
      ? progress.error?.message || copy.messages.failed
      : progress.state === 'cancelled'
        ? copy.messages.cancelled
        : copy.messages.succeeded;

  const StatusIcon = progress.state === 'failed' ? AlertTriangle : progress.state === 'succeeded' ? CheckCircle2 : Info;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label="P08 long operation progress"
      className={cn('pointer-events-none fixed inset-0 z-50', className)}
    >
      <div className="pointer-events-auto fixed right-6 bottom-6 w-[min(672px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-[var(--shadow-xl)]">
        {progress.state === 'queued' || progress.state === 'running' ? (
          <div className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary glow-primary" />
        ) : null}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-glow-top" />
        <div className="relative z-10">
          <ProgressHeader
            jobId={resolvedJobId}
            target={progress.target}
            source={progress.source}
            action={progress.action}
            state={progress.state}
            copy={copy}
            onClose={handleClose}
          />

          <div className="space-y-4 px-6 py-5">
            {progress.state === 'failed' || progress.state === 'cancelled' ? (
              <div className={cn('rounded-lg border p-3', toneClassNames[tone].panel)}>
                <div className="flex items-start gap-3">
                  <ColorVariant state={progress.state} className="mt-0.5 flex-shrink-0">
                    <StatusIcon className="h-4.5 w-4.5" aria-hidden />
                  </ColorVariant>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {progress.error?.code ? (
                        <span className={cn('rounded-sm border px-2 py-0.5 font-mono text-[11px]', toneClassNames[tone].badge)}>
                          {progress.error.code}
                        </span>
                      ) : null}
                      {progress.stage ? (
                        <span className="font-mono text-xs text-fg-subtle">
                          stage=<ColorVariant state={progress.state}>{progress.stage}</ColorVariant>
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-fg">{statusMessage}</p>
                    <p className="mt-1 text-xs text-fg-muted">
                      {copy.labels.target}: <span className="font-mono">{progress.target || copy.labels.unknownTarget}</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm">
                  <span className="text-fg-muted">{copy.labels.stage}:</span>{' '}
                  <span className="font-medium text-fg">{stageLabel(copy, progress.stage)}</span>
                  {progress.stage ? (
                    <span className="ml-2 font-mono text-xs text-fg-subtle">
                      stage=<ColorVariant state={progress.state}>{progress.stage}</ColorVariant>
                    </span>
                  ) : null}
                </p>
                <ColorVariant state={progress.state} className="font-mono text-sm font-medium tabular-nums">
                  {displayPercent}
                </ColorVariant>
              </div>
              <ProgressBar value={progress.percent} state={progress.state} />
              <p className="mt-2 truncate font-mono text-xs text-fg-subtle">
                {progress.currentText || copy.messages.running}
              </p>
            </div>

            <LogStream logs={progress.logs} copy={copy} />
          </div>

          <ActionButtons
            state={progress.state}
            canCancel={progress.canCancel}
            canRetry={progress.canRetry}
            copy={copy}
            onCancel={handleCancel}
            onClose={handleClose}
            onRetry={handleRetry}
            onViewLog={handleViewLog}
          />
        </div>
      </div>
    </section>
  );
}

export default P08;
export { useJobDialogStore } from './store/job-dialog-store';
