import { ExternalLink } from 'lucide-react';
import type { AppDetail } from '../../../../../shared/ipc-contract';
import { pickLocale, type Lang } from '../locales';

export interface PackageFieldsProps {
  detail: AppDetail | undefined;
  status: 'installable' | 'installed-latest' | 'installed-outdated' | 'unavailable';
  lang: Lang;
  latestVersion?: string;
  conflict?: string;
  installedAt?: string;
  installPath?: string;
  updated?: string;
}

interface FieldRow {
  label: string;
  value: React.ReactNode;
}

export function PackageFields({
  detail,
  status,
  lang,
  latestVersion,
  conflict,
  installedAt,
  installPath,
  updated,
}: PackageFieldsProps) {
  const t = pickLocale(lang);

  const description =
    detail?.description && detail.description.trim().length > 0
      ? detail.description
      : null;

  const homepage = detail?.homepage && detail.homepage.trim().length > 0 ? detail.homepage : null;

  const bucketLabel = detail?.source && detail.source.trim().length > 0 ? detail.source : t.dash;

  const rows: FieldRow[] = [
    {
      label: t.bucket,
      value: (
        <span className="inline-flex items-center gap-1.5 font-mono">
          <span
            className="h-1.5 w-1.5 rounded-full bg-accent"
            style={{ boxShadow: '0 0 6px var(--accent-glow)' }}
            aria-hidden
          />
          {bucketLabel}
          {detail?.source ? (
            <span className="ml-2 text-[12px] text-fg-muted">
              {t.versionSeparator} {t.bucketMeta}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      label: t.homepage,
      value: homepage ? (
        <a
          href={homepage}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent transition-colors hover:text-fg hover:underline"
        >
          {homepage}
          <ExternalLink className="ml-1 inline h-3 w-3 align-middle" aria-hidden />
        </a>
      ) : (
        <span className="font-mono text-fg-subtle text-[12.5px]">{t.dash}</span>
      ),
    },
  ];

  if (status === 'installable') {
    rows.push(
      {
        label: t.license,
        value: <span className="font-mono text-fg-subtle text-[12.5px]">{t.dash}</span>,
      },
      {
        label: t.source,
        value: <span className="font-mono text-fg-subtle text-[12.5px]">{t.dash}</span>,
      },
      {
        label: t.size,
        value: <span className="font-mono text-fg-subtle text-[12.5px]">{t.dash}</span>,
      },
      {
        label: t.checksum,
        value: <span className="font-mono text-fg-subtle text-[11.5px]">{t.dash}</span>,
      },
    );
  }

  if (status === 'installed-latest' || status === 'installed-outdated') {
    rows.push(
      {
        label: t.license,
        value: <span className="font-mono text-fg-subtle text-[12.5px]">{t.dash}</span>,
      },
    );
    if (installPath) {
      rows.push({
        label: t.installPath,
        value: (
          <span className="font-mono text-[12px] break-all text-fg">{installPath}</span>
        ),
      });
    }
    const installedDisplay = installedAt ?? updated ?? detail?.updated;
    if (installedDisplay) {
      rows.push({
        label: t.installedAt,
        value: (
          <span className="font-mono text-[12px] text-fg-muted">{installedDisplay}</span>
        ),
      });
    }
    if (status === 'installed-outdated') {
      rows.push({
        label: t.currentVersion,
        value: <span className="font-mono">{detail?.version || t.dash}</span>,
      });
      if (latestVersion) {
        rows.push({
          label: t.latestVersion,
          value: <span className="font-mono text-primary">{latestVersion}</span>,
        });
      }
    }
  }

  if (status === 'unavailable') {
    rows.push({
      label: t.license,
      value: <span className="font-mono text-fg-subtle text-[12.5px]">{t.dash}</span>,
    });
    if (conflict) {
      rows.push({
        label: t.conflict,
        value: <span className="font-mono text-warning">{conflict}</span>,
      });
    }
  }

  return (
    <div className="px-6 py-5">
      <div className="mb-5">
        <div className="mb-1.5 text-xs uppercase tracking-wide text-fg-subtle">{t.description}</div>
        <p className="text-sm leading-relaxed text-fg">{description ?? t.dash}</p>
      </div>

      {status === 'installed-outdated' && latestVersion ? (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/15 p-2.5 text-[12.5px] leading-relaxed text-warning"
          role="note"
        >
          <ExternalLink className="mt-px h-4 w-4 shrink-0" aria-hidden />
          <div>
            <span>{t.noticeNewer}:</span>
            <span className="ml-1 font-mono font-semibold text-fg">v{latestVersion}</span>
          </div>
        </div>
      ) : null}

      <div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[96px_1fr] items-start gap-3 border-b border-border py-2.5 last:border-b-0"
          >
            <div className="pt-0.5 text-[12px] font-medium text-fg-muted">{row.label}</div>
            <div className="text-[13px] leading-relaxed break-words text-fg">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}