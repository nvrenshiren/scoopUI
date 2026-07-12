import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { resolveP10Locale, translateP10 } from './locales';
import { EmptyState, type EmptyStateVariant } from './components/EmptyState';
import { ErrorState, type ErrorStateVariant } from './components/ErrorState';

const EMPTY_VARIANTS: EmptyStateVariant[] = [
  'empty-installed',
  'empty-available',
  'empty-search',
  'empty-buckets',
];

const ERROR_VARIANTS: ErrorStateVariant[] = [
  'read-failed',
  'scoop-unavailable',
  'job-failed',
];

const noop = () => undefined;

export default function P10Page() {
  const { i18n } = useTranslation();
  const locale = resolveP10Locale(i18n.language);
  const t = (key: string) => translateP10(key, locale);

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col overflow-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="font-mono text-[11px]">P10</Badge>
            <Badge variant="secondary" className="font-mono text-[11px]">v2 · dark</Badge>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
              {t('p10.page.title')}
            </h1>
            <p className="text-sm leading-relaxed text-fg-muted">
              {t('p10.page.description')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 font-mono text-[11px] text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary-glow)]" />
            {t('p10.page.reference')}
          </div>
        </header>

        <StateSection
          title={t('p10.section.empty')}
          legend={t('p10.legend.info')}
          count={EMPTY_VARIANTS.length}
        >
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {EMPTY_VARIANTS.map((variant) => (
              <EmptyState
                key={variant}
                variant={variant}
                query={variant === 'empty-search' ? 'ffmpeg' : undefined}
                onGoToBrowse={noop}
                onGoToBuckets={noop}
                onRetry={noop}
                onClearSearch={noop}
                onViewKnownBuckets={noop}
              />
            ))}
          </div>
        </StateSection>

        <StateSection
          title={t('p10.section.error')}
          legend={t('p10.legend.error')}
          count={ERROR_VARIANTS.length}
          destructive
        >
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {ERROR_VARIANTS.map((variant) => (
              <ErrorState
                key={variant}
                variant={variant}
                target="7zip"
                reason="Access is denied"
                onRetry={noop}
                onBackHome={noop}
                onBackToSource={noop}
                onGiveUp={noop}
              />
            ))}
          </div>
        </StateSection>

        <footer className="rounded-lg border border-border bg-bg-elevated px-4 py-3 text-xs leading-relaxed text-fg-muted">
          {t('p10.scope.note')}
        </footer>
      </div>
    </section>
  );
}

function StateSection({
  title,
  legend,
  count,
  destructive,
  children,
}: {
  title: string;
  legend: string;
  count: number;
  destructive?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <div className="flex items-center gap-2 font-mono text-[11px] text-fg-subtle">
          <span
            className={
              destructive
                ? 'h-2 w-2 rounded-full bg-destructive shadow-[0_0_6px_var(--destructive-glow)]'
                : 'h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary-glow)]'
            }
          />
          <span>{legend}</span>
          <span>{count}</span>
        </div>
      </div>
      {children}
    </section>
  );
}
