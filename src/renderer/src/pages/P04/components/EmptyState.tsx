import { Inbox, RefreshCw, TriangleAlert, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lookup, type Locale } from '../locales';
import type { InstalledPackagesError } from '../hooks/use-installed-packages';

interface EmptyStateProps {
  locale: Locale;
  variant: 'empty' | 'filtered';
  onBrowse?: () => void;
}

export function EmptyState({ locale, variant, onBrowse }: EmptyStateProps) {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="relative mb-5 rounded-full p-5"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--primary-glow), transparent)',
          }}
        />
        <Inbox
          className="relative text-fg-muted"
          strokeWidth={1.25}
          aria-hidden
          style={{ width: 44, height: 44 }}
        />
      </div>
      <h3 className="font-display text-lg font-semibold leading-tight">
        {lookup(locale, 'p04.empty.title')}
      </h3>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        {variant === 'filtered'
          ? lookup(locale, 'p04.search.placeholder')
          : lookup(locale, 'p04.empty.desc')}
      </p>
      {variant === 'empty' && onBrowse && (
        <Button
          onClick={onBrowse}
          variant="default"
          size="default"
          className="mt-6 gap-2 glow-primary"
        >
          <Search
            className="text-black"
            strokeWidth={2}
            aria-hidden
            style={{ width: 14, height: 14 }}
          />
          {lookup(locale, 'p04.actions.browseApps')}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  locale: Locale;
  error: InstalledPackagesError;
  onRetry: () => void;
}

export function ErrorState({ locale, error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="mb-5 rounded-full p-5"
        style={{
          background: 'var(--destructive-glow)',
          border: '1px solid var(--destructive)',
        }}
      >
        <TriangleAlert
          className="text-destructive"
          strokeWidth={1.25}
          aria-hidden
          style={{ width: 44, height: 44 }}
        />
      </div>
      <h3 className="font-display text-lg font-semibold leading-tight">
        {lookup(locale, 'p04.error.title')}
      </h3>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        {lookup(locale, 'p04.error.desc')}
      </p>
      <p className="mt-3 inline-block rounded-md px-3 py-1 font-mono text-[11px] text-fg-muted"
        style={{
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border)',
        }}
      >
        {lookup(locale, 'p04.error.code')}:{' '}
        <span className="text-destructive">{error.code || lookup(locale, 'p04.error.codeFallback')}</span>
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={onRetry}
          variant="default"
          size="default"
          className="gap-2 glow-primary"
        >
          <RefreshCw
            className="text-black"
            strokeWidth={2}
            aria-hidden
            style={{ width: 14, height: 14 }}
          />
          {lookup(locale, 'common.retry')}
        </Button>
      </div>
    </div>
  );
}