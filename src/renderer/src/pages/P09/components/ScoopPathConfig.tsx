/**
 * P09 Scoop 路径展示(只读)
 * - PRD §5:本阶段仅语言切换,Scoop 路径以只读形式展示,不在此页编辑
 * - 数据来源:窗口启动期 onboarding 写入 prefs.scoopInstallConfig;未写入时回退到 window.scoop.detect()
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, RefreshCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ScoopPathConfigProps {
  initialPath?: string | undefined;
  initialVersion?: string | undefined;
}

interface DetectResult {
  available: boolean;
  version?: string;
  path?: string;
}

export function ScoopPathConfig({ initialPath, initialVersion }: ScoopPathConfigProps) {
  const { t } = useTranslation('p09');
  const [path, setPath] = useState<string | undefined>(initialPath);
  const [version, setVersion] = useState<string | undefined>(initialVersion);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPath(initialPath);
    setVersion(initialVersion);
  }, [initialPath, initialVersion]);

  const handleDetect = async () => {
    setBusy(true);
    try {
      const result = await window.scoop.detect();
      if (result.ok) {
        const data = result.data as DetectResult;
        setPath(data.path);
        setVersion(data.version);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="status-strip flex items-center gap-3 rounded-md border border-border bg-bg-overlay/70 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Folder className="h-4.5 w-4.5" />
        </div>
        <div className="font-mono text-xs text-fg-subtle">
          scoop --version
        </div>
        {version && (
          <span className="ml-auto inline-flex h-6 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-2 text-xs text-primary">
            <span className="text-fg-muted">{t('p09.section.path.version.label')}:</span>
            <span className="font-mono">{version}</span>
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            readOnly
            value={path ?? ''}
            placeholder={t('p09.section.path.placeholder')}
            className={cn('pl-9 font-mono text-xs')}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleDetect}
          disabled={busy}
          aria-label={t('p09.section.path.detect')}
        >
          <RefreshCcw className={cn('h-4 w-4', busy && 'animate-spin')} />
          <span>{t('p09.section.path.detect')}</span>
        </Button>
      </div>
    </div>
  );
}
