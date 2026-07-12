import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '../locales';
import { cn } from '@/lib/utils';

export type ErrorBannerVariant = 'banner' | 'row';

export interface ErrorBannerProps {
  variant: ErrorBannerVariant;
  message?: string;
  code?: string;
  onRetry?: () => void;
  onDiagnose?: () => void;
  onDiscard?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorBanner({
  variant,
  message,
  code,
  onRetry,
  onDiagnose,
  onDiscard,
  retryLabel,
  className,
}: ErrorBannerProps) {
  const t = useT();
  const defaultMessage = variant === 'row' ? t('error.row.detail') : t('error.known.desc');
  const defaultCode = variant === 'row' ? t('error.row.code') : 'E_BUCKET_FETCH_FAILED';
  const resolvedMessage = message ?? defaultMessage;
  const resolvedCode = code ?? defaultCode;
  const resolvedRetry = retryLabel ?? t('common.retry');

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center px-6 py-16 text-center',
          'min-h-[420px]',
          className,
        )}
      >
        <div className="mb-5 rounded-full border border-destructive p-5" style={{ background: 'var(--destructive-glow)' }}>
          <AlertCircle className="h-11 w-11 text-destructive" strokeWidth={1.25} />
        </div>
        <h3 className="font-display text-lg font-semibold">{t('error.known.title')}</h3>
        <p className="mt-2 max-w-md text-sm text-fg-muted">{resolvedMessage}</p>
        <p className="mt-3 inline-block rounded-md px-3 py-1 font-mono text-xs text-fg-muted" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
          {t('error.known.code')}: <span className="text-destructive">{resolvedCode}</span>
        </p>
        <div className="mt-6 flex items-center gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="glow-primary">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{resolvedRetry}</span>
            </Button>
          )}
          {onDiagnose && (
            <Button variant="outline" onClick={onDiagnose}>
              {t('error.known.diagnose')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <tr className={cn('border-b border-border', className)} style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
      <td colSpan={5} className="px-4 py-2.5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-sm border border-destructive bg-destructive/10 px-2 py-0.5 font-mono text-[11px] text-destructive">
                {resolvedCode}
              </span>
              <span className="text-xs text-fg-muted">
                {t('error.row.stage')}=<span className="font-mono text-destructive">{t('error.row.stageValue')}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-fg-muted">{resolvedMessage}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onRetry && (
              <Button size="sm" onClick={onRetry} className="glow-primary">
                <span>{t('error.row.retry')}</span>
              </Button>
            )}
            {onDiscard && (
              <Button size="sm" variant="ghost" onClick={onDiscard}>
                <span>{t('error.row.discard')}</span>
              </Button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}