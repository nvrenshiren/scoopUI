import type { ReactNode } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveP10Locale, translateP10 } from '../locales';
import { ErrorCodeBlock } from './ErrorCodeBlock';
import { StateHero, type StateHeroAction } from './StateHero';

export type ErrorStateVariant = 'read-failed' | 'scoop-unavailable' | 'job-failed';

export interface ErrorStateProps {
  variant: ErrorStateVariant;
  code?: string;
  target?: string;
  operation?: string;
  reason?: string;
  actions?: StateHeroAction[];
  onRetry?: () => void;
  onBackHome?: () => void;
  onBackToSource?: () => void;
  onGiveUp?: () => void;
  className?: string;
}

const ERROR_META = {
  'read-failed': {
    badgeKey: 'p10.error.read.badge',
    labelKey: 'p10.error.read.label',
    scopeKey: 'p10.error.read.scope',
    titleKey: 'p10.error.read.title',
    descriptionKey: 'p10.error.read.description',
    defaultCode: 'E_SCOOP_PARSE_FAILED',
    illustration: <ReadFailedIllustration />,
  },
  'scoop-unavailable': {
    badgeKey: 'p10.error.scoop.badge',
    labelKey: 'p10.error.scoop.label',
    scopeKey: 'p10.error.scoop.scope',
    titleKey: 'p10.error.scoop.title',
    descriptionKey: 'p10.error.scoop.description',
    defaultCode: 'E_SCOOP_NOT_FOUND',
    illustration: <ReadFailedIllustration />,
  },
  'job-failed': {
    badgeKey: 'p10.error.job.badge',
    labelKey: 'p10.error.job.label',
    scopeKey: 'p10.error.job.scope',
    titleKey: 'p10.error.job.title',
    descriptionKey: 'p10.error.job.description',
    defaultCode: 'E_SCOOP_PERMISSION_DENIED',
    illustration: <JobFailedIllustration />,
  },
} satisfies Record<ErrorStateVariant, ErrorStateMeta>;

interface ErrorStateMeta {
  badgeKey: string;
  labelKey: string;
  scopeKey: string;
  titleKey: string;
  descriptionKey: string;
  defaultCode: string;
  illustration: ReactNode;
}

export function ErrorState({
  variant,
  code,
  target = '7zip',
  operation,
  reason,
  actions,
  onRetry,
  onBackHome,
  onBackToSource,
  onGiveUp,
  className,
}: ErrorStateProps) {
  const { i18n } = useTranslation();
  const locale = resolveP10Locale(i18n.language);
  const t = (key: string, vars?: Record<string, string | number>) =>
    translateP10(key, locale, vars);
  const meta = ERROR_META[variant];
  const resolvedOperation = operation ?? t('p10.error.job.operation');
  const resolvedCode = code ?? meta.defaultCode;
  const title =
    variant === 'job-failed'
      ? t(meta.titleKey, { target, operation: resolvedOperation })
      : t(meta.titleKey);
  const description =
    variant === 'job-failed'
      ? reason
        ? t(meta.descriptionKey, { reason })
        : t('p10.error.job.descriptionNoReason')
      : t(meta.descriptionKey);

  return (
    <StateHero
      tone="error"
      badge={t(meta.badgeKey)}
      label={t(meta.labelKey)}
      scope={t(meta.scopeKey)}
      title={title}
      description={description}
      icon={<AlertCircle />}
      illustration={meta.illustration}
      actions={
        actions ??
        createErrorActions(variant, t, {
          onRetry,
          onBackHome,
          onBackToSource,
          onGiveUp,
        })
      }
      className={className}
    >
      <ErrorCodeBlock code={resolvedCode} label={t('p10.code.label')} detail={t('p10.code.detail')} />
    </StateHero>
  );
}

function createErrorActions(
  variant: ErrorStateVariant,
  t: (key: string) => string,
  handlers: Pick<ErrorStateProps, 'onRetry' | 'onBackHome' | 'onBackToSource' | 'onGiveUp'>,
): StateHeroAction[] {
  if (variant === 'job-failed') {
    return [
      {
        label: t('p10.action.retry'),
        icon: <RefreshCw />,
        onClick: handlers.onRetry,
      },
      {
        label: t('p10.action.backSource'),
        icon: <ArrowLeft />,
        variant: 'outline',
        onClick: handlers.onBackToSource,
      },
      {
        label: t('p10.action.giveUp'),
        icon: <X />,
        variant: 'ghost',
        onClick: handlers.onGiveUp,
      },
    ];
  }

  return [
    {
      label: variant === 'scoop-unavailable' ? t('p10.action.retryRead') : t('p10.action.retry'),
      icon: <RefreshCw />,
      onClick: handlers.onRetry,
    },
    {
      label: t('p10.action.backHome'),
      icon: <ArrowLeft />,
      variant: 'outline',
      onClick: handlers.onBackHome,
    },
  ];
}

function ReadFailedIllustration() {
  return (
    <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="20" y="26" width="88" height="76" rx="6" />
      <path d="M20 50h88" />
      <path d="M28 38h6M40 38h6" />
      <path d="M40 70h48M40 84h36" />
    </svg>
  );
}

function JobFailedIllustration() {
  return (
    <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="64" cy="64" r="44" />
      <path d="M40 40l48 48" strokeWidth="3" />
    </svg>
  );
}
