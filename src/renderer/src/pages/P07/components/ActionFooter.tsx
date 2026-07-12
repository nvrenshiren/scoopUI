import { useState } from 'react';
import { Download, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pickLocale, type Lang } from '../locales';

export type PackageStatus =
  | 'installable'
  | 'installed-latest'
  | 'installed-outdated'
  | 'unavailable';

export interface ActionFooterProps {
  status: PackageStatus;
  lang: Lang;
  name: string;
  latestVersion?: string;
  onInstall: () => void;
  onUninstall: () => void;
  onUpdate: () => void;
}

export function ActionFooter({
  status,
  lang,
  name,
  latestVersion,
  onInstall,
  onUninstall,
  onUpdate,
}: ActionFooterProps) {
  const t = pickLocale(lang);
  const [busy, setBusy] = useState<'install' | 'uninstall' | 'update' | null>(null);

  const wrap = (kind: 'install' | 'uninstall' | 'update', fn: () => void) => () => {
    if (busy) return;
    setBusy(kind);
    Promise.resolve(fn()).finally(() => setBusy(null));
  };

  if (status === 'unavailable') {
    return (
      <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
        <div className="text-xs text-fg-muted">{t.resolveConflict}</div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="default" disabled>
            {t.viewConflict}
          </Button>
          <Button type="button" variant="secondary" size="default" onClick={() => undefined}>
            {t.close}
          </Button>
        </div>
      </footer>
    );
  }

  if (status === 'installable') {
    return (
      <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
        <div className="font-mono text-xs text-fg-muted">
          {t.target}: <span className="text-fg">{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" size="default" onClick={() => undefined}>
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            className="glow-primary"
            disabled={busy !== null}
            onClick={wrap('install', onInstall)}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {t.install}
            <span
              className="ml-1 font-mono text-[11px]"
              style={{ color: '#06281A', opacity: 0.7 }}
            >
              {name}
            </span>
          </Button>
        </div>
      </footer>
    );
  }

  // installed-latest OR installed-outdated
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
      {status === 'installed-outdated' ? (
        <button
          type="button"
          className="bg-transparent text-xs font-mono text-destructive transition-opacity hover:underline disabled:opacity-50"
          onClick={wrap('uninstall', onUninstall)}
          disabled={busy !== null}
        >
          {t.uninstall}
        </button>
      ) : (
        <div className="font-mono text-xs text-fg-muted">
          {t.upToDate} · <span className="text-fg">v{name}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="default" onClick={() => undefined}>
          {t.close}
        </Button>
        {status === 'installed-outdated' ? (
          <Button
            type="button"
            variant="default"
            size="default"
            className="glow-primary"
            disabled={busy !== null}
            onClick={wrap('update', onUpdate)}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {t.update}
            {latestVersion ? (
              <span
                className="ml-1 font-mono text-[11px]"
                style={{ color: '#06281A', opacity: 0.7 }}
              >
                {t.fromTo} v{latestVersion}
              </span>
            ) : null}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="default"
            className="glow-destructive"
            disabled={busy !== null}
            onClick={wrap('uninstall', onUninstall)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {t.uninstall}
          </Button>
        )}
      </div>
    </footer>
  );
}