import { AlertTriangle, CheckCircle2, Loader2, Radar, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { P01Copy } from '../locales';
import type { ScoopDetectData } from '../hooks/use-scoop-detect';

interface StatusHeroProps {
  copy: P01Copy;
  data?: ScoopDetectData;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

function formatTemplate(template: string, value: string): string {
  return template.replace('{{version}}', value).replace('{{path}}', value);
}

export function StatusHero({ copy, data, isLoading, error, onRetry }: StatusHeroProps) {
  const available = data?.available === true;
  const failed = !isLoading && !available;
  const progress = isLoading ? 58 : available ? 100 : 24;
  const Icon = isLoading ? Loader2 : available ? CheckCircle2 : AlertTriangle;
  const title = isLoading
    ? copy.statusHero.detectingTitle
    : available
      ? copy.statusHero.readyTitle
      : error
        ? copy.statusHero.errorTitle
        : copy.statusHero.notFoundTitle;
  const subtitle = isLoading
    ? copy.statusHero.detectingSubtitle
    : available
      ? copy.statusHero.readySubtitle
      : error
        ? copy.statusHero.errorSubtitle
        : copy.statusHero.notFoundSubtitle;
  const stage = isLoading
    ? copy.statusHero.stageDetecting
    : available
      ? copy.statusHero.stageReady
      : error
        ? copy.statusHero.stageError
        : copy.statusHero.stageNotFound;
  const badgeVariant = isLoading ? 'secondary' : available ? 'success' : error ? 'destructive' : 'warning';

  return (
    <Card className="border-border bg-bg-elevated shadow-xl">
      <div className="card-top-line" />
      <CardHeader className="gap-4 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
                available
                  ? 'border-primary/30 bg-primary/10 text-primary glow-primary'
                  : failed
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : 'border-border bg-bg-overlay text-primary glow-primary',
              )}
            >
              <Icon className={cn('h-6 w-6', isLoading && 'animate-spin')} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <Badge variant={badgeVariant}>{stage}</Badge>
              </div>
              <CardDescription className="max-w-2xl leading-relaxed">{subtitle}</CardDescription>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs text-fg-subtle">
                <Badge variant="secondary" className="font-mono">{copy.page.metaDetect}</Badge>
                <Badge variant="secondary" className="font-mono">{copy.page.metaLatency}</Badge>
                <Badge variant="outline" className="font-mono text-fg-muted">{copy.page.metaFields}</Badge>
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onRetry} disabled={isLoading}>
            <Radar className={cn('h-4 w-4', isLoading && 'animate-pulse')} />
            {copy.common.retry}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-0">
        <div className="rounded-lg border border-border bg-bg p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-fg-muted">{copy.statusHero.progressLabel}</span>
            <span className="font-mono text-xs text-primary tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="border border-border" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border bg-bg-overlay px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-fg-subtle">{copy.statusHero.versionLabel}</div>
              <div className="mt-1 truncate font-mono text-sm text-fg">
                {data?.version ? formatTemplate(copy.checklist.foundVersion, data.version) : copy.common.unavailable}
              </div>
            </div>
            <div className="rounded-md border border-border bg-bg-overlay px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-fg-subtle">{copy.statusHero.pathLabel}</div>
              <div className="mt-1 truncate font-mono text-sm text-fg">
                {data?.path ? formatTemplate(copy.checklist.foundPath, data.path) : error?.message ?? copy.common.unavailable}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-bg-overlay p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-fg">{copy.statusHero.configPreviewTitle}</h3>
              <p className="mt-1 text-sm text-fg-muted">{copy.statusHero.configPreviewSubtitle}</p>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {copy.configOptions.map((item) => (
              <div key={item.key} className="rounded-md border border-border bg-bg px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-fg">{item.label}</span>
                  <Badge variant="secondary" className="shrink-0 font-mono">{item.key}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{item.description}</p>
                <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="truncate text-primary">{item.defaultValue}</span>
                  <span className="truncate text-fg-subtle">{item.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
