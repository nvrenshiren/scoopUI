import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ConfigChecklist } from './components/ConfigChecklist';
import { EmptyState } from './components/EmptyState';
import { InstallGuide } from './components/InstallGuide';
import { StatusHero } from './components/StatusHero';
import { useScoopDetect } from './hooks/use-scoop-detect';
import { P01en, P01zh } from './locales';

export default function P01Page() {
  const { i18n } = useTranslation();
  const copy = useMemo(() => (i18n.language?.startsWith('en') ? P01en : P01zh), [i18n.language]);
  const { data, isLoading, error, refetch } = useScoopDetect();
  const ready = data?.available === true;
  const showInstallGuide = !isLoading && !ready;

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const retry = () => {
    void refetch();
  };

  return (
    <div className="relative h-full w-full overflow-y-auto bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-glow-top" />
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary glow-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight text-fg">{copy.page.title}</h1>
            <Badge variant="success" className="font-mono">P01</Badge>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-fg-muted">{copy.page.subtitle}</p>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <Badge variant="secondary">{copy.page.metaDetect}</Badge>
            <Badge variant="secondary">{copy.page.metaLatency}</Badge>
            <Badge variant="outline" className="text-fg-muted">{copy.page.metaFields}</Badge>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <StatusHero copy={copy} data={data} isLoading={isLoading} error={error} onRetry={retry} />
            {showInstallGuide ? (
              <InstallGuide copy={copy} />
            ) : (
              <EmptyState copy={copy} variant={ready ? 'ready' : 'waiting'} onAction={ready ? undefined : retry} />
            )}
          </section>
          <aside className="space-y-6">
            <ConfigChecklist copy={copy} data={data} isLoading={isLoading} error={error} />
          </aside>
        </div>
      </main>
    </div>
  );
}
