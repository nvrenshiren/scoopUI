import type { ReactNode } from 'react';
import { ArrowRight, Layers, Package, RefreshCw, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveP10Locale, translateP10 } from '../locales';
import { StateHero, type StateHeroAction } from './StateHero';

export type EmptyStateVariant =
  | 'empty-installed'
  | 'empty-available'
  | 'empty-search'
  | 'empty-buckets';

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  query?: string;
  actions?: StateHeroAction[];
  onGoToBrowse?: () => void;
  onGoToBuckets?: () => void;
  onRetry?: () => void;
  onClearSearch?: () => void;
  onViewKnownBuckets?: () => void;
  className?: string;
}

const EMPTY_META = {
  'empty-installed': {
    badgeKey: 'p10.empty.installed.badge',
    labelKey: 'p10.empty.installed.label',
    scopeKey: 'p10.empty.installed.scope',
    titleKey: 'p10.empty.installed.title',
    descriptionKey: 'p10.empty.installed.description',
    icon: <Package />,
    illustration: <InstalledIllustration />,
  },
  'empty-available': {
    badgeKey: 'p10.empty.available.badge',
    labelKey: 'p10.empty.available.label',
    scopeKey: 'p10.empty.available.scope',
    titleKey: 'p10.empty.available.title',
    descriptionKey: 'p10.empty.available.description',
    icon: <Package />,
    illustration: <AvailableIllustration />,
  },
  'empty-search': {
    badgeKey: 'p10.empty.search.badge',
    labelKey: 'p10.empty.search.label',
    scopeKey: 'p10.empty.search.scope',
    titleKey: 'p10.empty.search.title',
    descriptionKey: 'p10.empty.search.description',
    icon: <Search />,
    illustration: <SearchIllustration />,
  },
  'empty-buckets': {
    badgeKey: 'p10.empty.buckets.badge',
    labelKey: 'p10.empty.buckets.label',
    scopeKey: 'p10.empty.buckets.scope',
    titleKey: 'p10.empty.buckets.title',
    descriptionKey: 'p10.empty.buckets.description',
    icon: <Layers />,
    illustration: <BucketsIllustration />,
  },
} satisfies Record<EmptyStateVariant, EmptyStateMeta>;

interface EmptyStateMeta {
  badgeKey: string;
  labelKey: string;
  scopeKey: string;
  titleKey: string;
  descriptionKey: string;
  icon: ReactNode;
  illustration: ReactNode;
}

export function EmptyState({
  variant,
  query,
  actions,
  onGoToBrowse,
  onGoToBuckets,
  onRetry,
  onClearSearch,
  onViewKnownBuckets,
  className,
}: EmptyStateProps) {
  const { i18n } = useTranslation();
  const locale = resolveP10Locale(i18n.language);
  const t = (key: string, vars?: Record<string, string | number>) =>
    translateP10(key, locale, vars);
  const meta = EMPTY_META[variant];
  const title =
    variant === 'empty-search' && query
      ? t('p10.empty.search.titleWithQuery', { query })
      : t(meta.titleKey);

  return (
    <StateHero
      tone="info"
      badge={t(meta.badgeKey)}
      label={t(meta.labelKey)}
      scope={t(meta.scopeKey)}
      title={title}
      description={t(meta.descriptionKey)}
      icon={meta.icon}
      illustration={meta.illustration}
      actions={
        actions ??
        createEmptyActions(variant, t, {
          onGoToBrowse,
          onGoToBuckets,
          onRetry,
          onClearSearch,
          onViewKnownBuckets,
        })
      }
      className={className}
    />
  );
}

function createEmptyActions(
  variant: EmptyStateVariant,
  t: (key: string) => string,
  handlers: Pick<
    EmptyStateProps,
    'onGoToBrowse' | 'onGoToBuckets' | 'onRetry' | 'onClearSearch' | 'onViewKnownBuckets'
  >,
): StateHeroAction[] {
  if (variant === 'empty-installed') {
    return [
      {
        label: t('p10.action.goBrowse'),
        icon: <ArrowRight />,
        onClick: handlers.onGoToBrowse,
      },
    ];
  }

  if (variant === 'empty-available') {
    return [
      {
        label: t('p10.action.goBuckets'),
        icon: <Layers />,
        onClick: handlers.onGoToBuckets,
      },
      {
        label: t('p10.action.retryRead'),
        icon: <RefreshCw />,
        variant: 'outline',
        onClick: handlers.onRetry,
      },
    ];
  }

  if (variant === 'empty-search') {
    return [
      {
        label: t('p10.action.clearSearch'),
        icon: <X />,
        onClick: handlers.onClearSearch,
      },
    ];
  }

  return [
    {
      label: t('p10.action.viewKnownBuckets'),
      icon: <ArrowRight />,
      onClick: handlers.onViewKnownBuckets,
    },
  ];
}

function InstalledIllustration() {
  return (
    <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="20" y="34" width="88" height="64" rx="6" />
      <path d="M20 50h88" />
      <path d="M36 34V26a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4v8" />
      <path d="M40 70h28M40 80h20" />
    </svg>
  );
}

function AvailableIllustration() {
  return (
    <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="56" cy="56" r="28" />
      <path d="m78 78 18 18" />
      <rect x="22" y="92" width="84" height="14" rx="3" />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="56" cy="56" r="28" />
      <path d="m78 78 18 18" />
      <path d="M40 56h32" strokeWidth="3" />
    </svg>
  );
}

function BucketsIllustration() {
  return (
    <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M64 18 16 38v50l48 22 48-22V38z" />
      <path d="M16 38l48 22 48-22" />
      <path d="M64 60v40" />
    </svg>
  );
}
