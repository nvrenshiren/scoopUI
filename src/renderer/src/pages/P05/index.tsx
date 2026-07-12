/**
 * P05 · 浏览与搜索软件包页
 * - 组合 BrowseTable + SearchBar + ResultTable + EmptyState
 * - 数据源:window.scoop.listAvailable / listInstalled / search / installApp
 * - 视图切换:查询为空 → 浏览(query 全量);查询非空 → 搜索结果
 * - 详情:点击行 → toast 引导(P07 待实现);安装 → installApp mutation(P08 待实现)
 */

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Layers, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import type { AppInfo } from '../../../../shared/ipc-contract';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { SearchBar } from './components/SearchBar';
import { BrowseTable } from './components/BrowseTable';
import { ResultTable } from './components/ResultTable';
import { EmptyState } from './components/EmptyState';
import { useAvailablePackages } from './hooks/use-available-packages';
import { usePackageSearch } from './hooks/use-package-search';
import './locales';

type TabKey = 'all' | 'available' | 'installed';

interface InstallVariables {
  pkg: AppInfo;
}

export function P05Page() {
  const { t } = useTranslation('p05');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const browseQuery = useAvailablePackages();
  const searchQuery = usePackageSearch(query);

  const installedNames = useMemo(() => {
    const set = new Set<string>();
    browseQuery.data?.installed.forEach((pkg) => set.add(pkg.name));
    return set;
  }, [browseQuery.data]);

  const bucketsCount = useMemo(() => {
    const sources = new Set<string>();
    browseQuery.data?.available.forEach((pkg) => sources.add(pkg.source));
    browseQuery.data?.installed.forEach((pkg) => sources.add(pkg.source));
    return sources.size;
  }, [browseQuery.data]);

  const totalApps = useMemo(() => {
    if (!browseQuery.data) return 0;
    const all = new Set<string>();
    browseQuery.data.available.forEach((pkg) => all.add(pkg.name));
    browseQuery.data.installed.forEach((pkg) => all.add(pkg.name));
    return all.size;
  }, [browseQuery.data]);

  const counts = useMemo(() => {
    const installed = browseQuery.data?.installed.length ?? 0;
    const availableOnly =
      browseQuery.data?.available.filter((pkg) => !installedNames.has(pkg.name)).length ?? 0;
    return {
      all: installed + availableOnly,
      available: availableOnly,
      installed,
    };
  }, [browseQuery.data, installedNames]);

  const installMutation = useMutation<{ ok: boolean; message?: string }, Error, InstallVariables>({
    mutationFn: async ({ pkg }) => {
      const result = await window.scoop.installApp({
        name: pkg.name,
        bucket: pkg.source || undefined,
        global: false,
      });
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data, { pkg }) => {
      if (data.ok) {
        toast.success(t('p05.install.started', { name: pkg.name }));
        browseQuery.refetch();
      } else {
        toast.error(t('p05.install.failed', { message: data.message ?? 'unknown' }));
      }
    },
    onError: (err, { pkg }) => {
      toast.error(t('p05.install.failed', { message: err.message }));
    },
  });

  const browseRows = useMemo(() => {
    if (!browseQuery.data) return [];
    const installed = browseQuery.data.installed;
    const installable = browseQuery.data.available.filter((pkg) => !installedNames.has(pkg.name));
    if (tab === 'installed') return installed;
    if (tab === 'available') return installable;
    return [...installed, ...installable].sort((a, b) => a.name.localeCompare(b.name));
  }, [browseQuery.data, installedNames, tab]);

  const isSearching = query.trim().length > 0;

  const handleSelect = (pkg: AppInfo) => {
    setSelectedName(pkg.name);
    toast.message(`${t('p05.col.info')}: ${pkg.info || pkg.name}`, {
      description: pkg.source,
    });
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* PageHeader · 标题 + 搜索 + 桶徽标 + 刷新 */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-bg-elevated px-6">
        <div className="flex shrink-0 items-baseline gap-3">
          <h1 className="font-display text-lg font-semibold leading-none text-fg">
            {t('p05.title')}
          </h1>
          <span className="font-mono text-xs text-fg-subtle">{t('p05.path')}</span>
        </div>

        <div className="ml-2 max-w-[560px] flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            placeholder={t('p05.search.placeholder')}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Badge variant="success" className="gap-1.5">
            <Layers className="h-3 w-3" strokeWidth={1.6} />
            <span>
              {t('p05.bucketSummary', { buckets: bucketsCount, apps: totalApps })}
            </span>
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('p05.refresh')}
            title={t('p05.refresh')}
            onClick={() => browseQuery.refetch()}
            disabled={browseQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${browseQuery.isFetching ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </header>

      {/* Toolbar · Tabs + Sort */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-bg-elevated px-6">
        <div className="flex items-center gap-1" role="tablist">
          {(
            [
              { key: 'all', label: t('p05.tab.all'), count: counts.all },
              { key: 'available', label: t('p05.tab.available'), count: counts.available },
              { key: 'installed', label: t('p05.tab.installed'), count: counts.installed },
            ] as { key: TabKey; label: string; count: number }[]
          ).map(({ key, label, count }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={
                  'relative inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors ' +
                  (active
                    ? 'text-fg'
                    : 'text-fg-muted hover:bg-bg-overlay hover:text-fg')
                }
              >
                <span>{label}</span>
                <span
                  className={
                    'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ' +
                    (active ? 'bg-primary/15 text-primary' : 'bg-bg-overlay text-fg-muted')
                  }
                >
                  {count}
                </span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[-1px] left-3 right-3 h-0.5 rounded-full bg-primary shadow-[0_1px_8px_var(--primary-glow)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-fg-subtle">{t('p05.sort.label')}</span>
          <Button variant="outline" size="sm">
            {t('p05.sort.byName')}
          </Button>
        </div>
      </div>

      {/* Main */}
      <main className="relative flex-1 overflow-auto">
        {browseQuery.isError && (
          <EmptyState
            variant="error"
            onRetry={() => {
              browseQuery.refetch();
            }}
          />
        )}

        {!browseQuery.isError && isSearching && (
          <SearchResultsView
            query={query}
            searchQuery={searchQuery}
            installedNames={installedNames}
            selectedName={selectedName}
            installingName={
              installMutation.isPending ? installMutation.variables?.pkg.name ?? null : null
            }
            onSelect={handleSelect}
            onInstall={(pkg) => installMutation.mutate({ pkg })}
            onClear={() => setQuery('')}
          />
        )}

        {!browseQuery.isError && !isSearching && (
          <BrowseView
            loading={browseQuery.isLoading}
            rows={browseRows}
            installedNames={installedNames}
            selectedName={selectedName}
            installingName={
              installMutation.isPending ? installMutation.variables?.pkg.name ?? null : null
            }
            onSelect={handleSelect}
            onInstall={(pkg) => installMutation.mutate({ pkg })}
          />
        )}
      </main>
    </div>
  );
}

interface SearchResultsViewProps {
  query: string;
  searchQuery: ReturnType<typeof usePackageSearch>;
  installedNames: Set<string>;
  selectedName: string | null;
  installingName: string | null;
  onSelect: (pkg: AppInfo) => void;
  onInstall: (pkg: AppInfo) => void;
  onClear: () => void;
}

function SearchResultsView({
  query,
  searchQuery,
  installedNames,
  selectedName,
  installingName,
  onSelect,
  onInstall,
  onClear,
}: SearchResultsViewProps) {
  const rows = searchQuery.data ?? [];
  const showEmpty =
    !searchQuery.isLoading &&
    !searchQuery.isError &&
    rows.length === 0 &&
    query.trim().length > 0;

  if (searchQuery.isError) {
    return (
      <EmptyState
        variant="error"
        onRetry={() => {
          searchQuery.refetch();
        }}
      />
    );
  }

  if (showEmpty) {
    return <EmptyState variant="search-empty" query={query} onClear={onClear} />;
  }

  return (
    <ResultTable
      rows={rows}
      installedNames={installedNames}
      loading={searchQuery.isLoading}
      selectedName={selectedName}
      installingName={installatingNameSafe(installingName)}
      onSelect={onSelect}
      onInstall={onInstall}
    />
  );
}

function installatingNameSafe(name: string | null): string | null {
  return name;
}

interface BrowseViewProps {
  loading: boolean;
  rows: AppInfo[];
  installedNames: Set<string>;
  selectedName: string | null;
  installingName: string | null;
  onSelect: (pkg: AppInfo) => void;
  onInstall: (pkg: AppInfo) => void;
}

function BrowseView({
  loading,
  rows,
  installedNames,
  selectedName,
  installingName,
  onSelect,
  onInstall,
}: BrowseViewProps) {
  if (!loading && rows.length === 0) {
    return <EmptyState variant="no-buckets" />;
  }

  return (
    <BrowseTable
      rows={rows}
      installedNames={installedNames}
      loading={loading}
      selectedName={selectedName}
      installingName={installingName}
      onSelect={onSelect}
      onInstall={onInstall}
    />
  );
}export default P05Page;
