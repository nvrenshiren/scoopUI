/**
 * EmptyState · P10 子状态(搜索无结果 / 列表为空 / 读取失败)
 * - variant: search-empty | no-buckets | error
 * - 提供清空查询、管理桶、重试入口
 */

import { useTranslation } from 'react-i18next';
import { AlertCircle, Inbox, SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EmptyStateVariant = 'search-empty' | 'no-buckets' | 'error';

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  query?: string;
  onClear?: () => void;
  onManageBuckets?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function EmptyState({
  variant,
  query,
  onClear,
  onManageBuckets,
  onRetry,
  className,
}: EmptyStateProps) {
  const { t } = useTranslation('p05');

  if (variant === 'error') {
    return (
      <div
        className={cn(
          'flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center',
          className,
        )}
      >
        <div className="relative mb-5 rounded-full border border-destructive/40 bg-destructive/10 p-5">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--destructive-glow), transparent)' }}
          />
          <AlertCircle className="relative h-11 w-11 text-destructive" strokeWidth={1.25} />
        </div>
        <h3 className="font-display text-lg font-semibold text-fg">{t('p05.error.title')}</h3>
        <p className="mt-2 max-w-md text-sm text-fg-muted">{t('p05.error.desc')}</p>
        {onRetry && (
          <Button variant="outline" className="mt-6" onClick={onRetry}>
            {t('p05.error.retry')}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'no-buckets') {
    return (
      <div
        className={cn(
          'flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center',
          className,
        )}
      >
        <div className="relative mb-5 rounded-full border border-border bg-bg-overlay p-5">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--primary-glow), transparent)' }}
          />
          <Inbox className="relative h-11 w-11 text-fg-muted" strokeWidth={1.25} />
        </div>
        <h3 className="font-display text-lg font-semibold text-fg">{t('p05.empty.noBuckets.title')}</h3>
        <p className="mt-2 max-w-md text-sm text-fg-muted">{t('p05.empty.noBuckets.desc')}</p>
        {onManageBuckets && (
          <Button variant="outline" className="mt-6" onClick={onManageBuckets}>
            {t('p05.empty.noBuckets.cta')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      <div className="relative mb-5 rounded-full border border-border bg-bg-overlay p-5">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, var(--primary-glow), transparent)' }}
        />
        <SearchX className="relative h-11 w-11 text-fg-muted" strokeWidth={1.25} />
      </div>
      <h3 className="font-display text-lg font-semibold text-fg">{t('p05.empty.title')}</h3>
      <p className="mt-2 max-w-md text-sm text-fg-muted">{t('p05.empty.desc')}</p>
      {query && (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-fg-muted">
          <span>{t('p05.empty.query')}</span>
          <span className="rounded border border-border bg-bg-overlay px-2 py-0.5 font-mono">
            {query}
          </span>
        </div>
      )}
      <div className="mt-6 flex items-center gap-3">
        {onClear && (
          <Button variant="outline" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
            {t('p05.empty.clear')}
          </Button>
        )}
        {onManageBuckets && (
          <Button variant="ghost" onClick={onManageBuckets}>
            {t('p05.empty.manage')}
          </Button>
        )}
      </div>
    </div>
  );
}