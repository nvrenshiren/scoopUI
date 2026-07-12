import { Package, Lock, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { pickLocale, type Lang } from '../locales';

export type PackageHeaderStatus =
  | 'installable'
  | 'installed-latest'
  | 'installed-outdated'
  | 'unavailable'
  | 'read-failed';

export interface PackageHeaderProps {
  status: PackageHeaderStatus;
  name: string;
  version: string;
  latestVersion?: string;
  lang: Lang;
}

export function PackageHeader({ status, name, version, latestVersion, lang }: PackageHeaderProps) {
  const t = pickLocale(lang);
  const isFailure = status === 'read-failed';
  const isConflict = status === 'unavailable';
  const isOutdated = status === 'installed-outdated';

  const iconBoxClass = cn(
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
    isFailure && 'border-destructive/30 bg-destructive/10 text-destructive',
    isConflict && 'border-border bg-bg-overlay text-fg-muted',
    !isFailure && !isConflict && 'border-primary/30 bg-primary/10 text-primary',
  );

  const Icon = isFailure ? AlertTriangle : isConflict ? Lock : Package;

  const badgeVariant: 'success' | 'warning' | 'destructive' =
    status === 'installable' || status === 'installed-latest'
      ? 'success'
      : status === 'installed-outdated'
        ? 'warning'
        : 'destructive';

  const badgeText =
    status === 'installable'
      ? t.badgeInstallable
      : status === 'installed-latest'
        ? t.badgeInstalled
        : status === 'installed-outdated'
          ? t.badgeOutdated
          : status === 'unavailable'
            ? t.badgeConflicting
            : t.badgeReadFailed;

  return (
    <header className="relative px-6 pt-6 pb-5 border-b border-border">
      <div className="flex items-start gap-4 pr-10">
        <div className={iconBoxClass}>
          <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold leading-tight text-fg">
            {t.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-fg-muted">{name}</span>
            <span className="text-fg-subtle text-xs">·</span>
            <span className="font-mono text-sm text-fg">{version || t.dash}</span>
            {isOutdated && latestVersion ? (
              <>
                <span className="text-fg-subtle text-xs">{t.fromTo}</span>
                <span className="font-mono text-sm text-primary">{latestVersion}</span>
              </>
            ) : null}
            <Badge variant={badgeVariant} className="ml-1 gap-1">
              {status === 'installable' ? (
                <DownloadGlyph />
              ) : status === 'installed-latest' ? (
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
              ) : null}
              {badgeText}
            </Badge>
            {status === 'installed-latest' ? (
              <Badge variant="secondary">{t.badgeLatest}</Badge>
            ) : null}
            {status === 'unavailable' ? (
              <ShieldAlert className="h-3 w-3 text-warning" aria-hidden />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function DownloadGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}