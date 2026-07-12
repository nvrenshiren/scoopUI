import { useMemo, useState } from 'react';
import { RefreshCw, Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from 'react-i18next';
import { lookup, type Locale } from './locales';
import { detectLang } from '@/pages/P07/locales';
import {
  useInstalledPackages,
  useUninstallPackage,
  useUpdatePackage,
  useBatchUpdate,
  type InstalledPackage,
} from './hooks/use-installed-packages';
import { PackageTable } from './components/PackageTable';
import { SearchFilter, type SearchFilterValue, type SortKey, type StatusFilter } from './components/SearchFilter';
import {
  UpdateActions,
  BatchUpdateDialog,
  UninstallDialog,
} from './components/UpdateActions';
import { EmptyState, ErrorState } from './components/EmptyState';

const INITIAL_FILTER: SearchFilterValue = {
  query: '',
  status: 'all',
  buckets: [],
  sort: 'name',
};

export function InstalledAppsPage() {
  // Locale: prefer persisted prefs (set by P09 onboarding), fall back to P07 detector
  const { i18n } = useTranslation();
  const prefs = useSettingsStore((s) => s.prefs);
  const locale: Locale = useMemo(() => {
    if (prefs?.uiLanguage === 'en-US') return 'en-US';
    if (prefs?.uiLanguage === 'zh-CN') return 'zh-CN';
    if (i18n.language?.startsWith('en')) return 'en-US';
    return detectLang() === 'en' ? 'en-US' : 'zh-CN';
  }, [prefs, i18n.language]);

  const { packages, isLoading, isError, error, refetch, outdatedCount, totalCount } =
    useInstalledPackages({ locale });

  const updateOne = useUpdatePackage({ locale });
  const uninstallOne = useUninstallPackage({ locale });
  const batchUpdate = useBatchUpdate({ locale });

  const [filter, setFilter] = useState<SearchFilterValue>(INITIAL_FILTER);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [uninstallTarget, setUninstallTarget] = useState<InstalledPackage | null>(null);
  const [updatingNames, setUpdatingNames] = useState<Set<string>>(new Set());
  const [uninstallingNames, setUninstallingNames] = useState<Set<string>>(new Set());

  const outdated = useMemo(
    () => packages.filter((p) => p.outdated?.isOutdated === true),
    [packages],
  );

  const onToggleSelect = (name: string, next: boolean) => {
    setSelectedNames((prev) => {
      const out = new Set(prev);
      if (next) out.add(name);
      else out.delete(name);
      return out;
    });
  };

  const onToggleSelectAll = (next: boolean) => {
    setSelectedNames(() => {
      if (!next) return new Set();
      const set = new Set<string>();
      for (const p of packages) set.add(p.name);
      return set;
    });
  };

  const handleActivate = (name: string) => {
    // P07 detail page is owned by task #19; selection state is conveyed
    // via the URL hash when the user clicks "查看详情" in the row menu.
    if (typeof window !== 'undefined') {
      window.location.hash = `#/apps/${encodeURIComponent(name)}`;
    }
  };

  const handleUpdateOne = (pkg: InstalledPackage) => {
    setUpdatingNames((prev) => new Set(prev).add(pkg.name));
    updateOne.mutate(pkg);
    // Optimistic visual; query invalidation will reconcile shortly.
    window.setTimeout(() => {
      setUpdatingNames((prev) => {
        const out = new Set(prev);
        out.delete(pkg.name);
        return out;
      });
    }, 1500);
  };

  const handleUninstallOne = (pkg: InstalledPackage) => {
    setUninstallTarget(pkg);
  };

  const confirmUninstall = () => {
    if (!uninstallTarget) return;
    const target = uninstallTarget;
    setUninstallTarget(null);
    setUninstallingNames((prev) => new Set(prev).add(target.name));
    uninstallOne.mutate(target);
    window.setTimeout(() => {
      setUninstallingNames((prev) => {
        const out = new Set(prev);
        out.delete(target.name);
        return out;
      });
    }, 1500);
  };

  const handleUpdateAll = () => {
    setBatchDialogOpen(true);
  };

  const confirmBatchUpdate = () => {
    if (outdated.length === 0) {
      setBatchDialogOpen(false);
      return;
    }
    batchUpdate.mutate(outdated);
    setBatchDialogOpen(false);
  };

  const handleUpdateSelected = () => {
    const list = outdated.filter((p) => selectedNames.has(p.name));
    if (list.length === 0) return;
    batchUpdate.mutate(list);
  };

  const handleUninstallSelected = () => {
    if (selectedNames.size === 0) return;
    const target = packages.find((p) => selectedNames.has(p.name));
    if (target) setUninstallTarget(target);
  };

  // ─── Error path ──────────────────────────────────────────────
  if (isError && error) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader
          title={lookup(locale, 'p04.title')}
          right={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              aria-label={lookup(locale, 'p04.actions.refresh')}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.6} aria-hidden />
            </Button>
          }
        />
        <ErrorState locale={locale} error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  // ─── Normal render ────────────────────────────────────────────
  const isEmpty = !isLoading && packages.length === 0;

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* Background grid + glow (matches P03 ContentOutlet) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-grid bg-glow-top"
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PageHeader
          title={lookup(locale, 'p04.title')}
          description={lookup(locale, 'p04.summary.total', {
            total: totalCount,
            outdated: outdatedCount,
          })}
          right={
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              aria-label={lookup(locale, 'p04.actions.refresh')}
            >
              <RefreshCw
                className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
                strokeWidth={1.6}
                aria-hidden
              />
            </Button>
          }
        />

        <SearchFilter
          locale={locale}
          packages={packages}
          value={filter}
          onChange={setFilter}
          selectedCount={selectedNames.size}
          totalCount={totalCount}
          outdatedCount={outdatedCount}
        />

        <UpdateActions
          locale={locale}
          outdated={outdated}
          outdatedCount={outdatedCount}
          selectedNames={Array.from(selectedNames)}
          onUpdateAll={handleUpdateAll}
          onUpdateSelected={handleUpdateSelected}
          onUninstallSelected={handleUninstallSelected}
          batchUpdating={updateOne.isPending || batchUpdate.isPending}
          batchUninstalling={uninstallOne.isPending}
        />

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center px-6 py-16">
            <div className="flex items-center gap-3 text-fg-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={1.8} aria-hidden />
              <span className="text-sm">{lookup(locale, 'p04.loading')}</span>
            </div>
          </div>
        ) : isEmpty ? (
          <EmptyState
            locale={locale}
            variant="empty"
            onBrowse={() => {
              if (typeof window !== 'undefined') window.location.hash = '#/browse';
            }}
          />
        ) : (
          <>
            <PackageTable
              locale={locale}
              packages={packages}
              filter={filter}
              selectedNames={selectedNames}
              onToggleSelect={onToggleSelect}
              onToggleSelectAll={onToggleSelectAll}
              onActivate={handleActivate}
              onUpdate={handleUpdateOne}
              onUninstall={handleUninstallOne}
              updatingNames={updatingNames}
              uninstallingNames={uninstallingNames}
              loading={isLoading}
            />

            {/* Footer (per-page meta placeholder) */}
            <div className="flex h-10 shrink-0 items-center justify-between border-t border-border bg-bg-elevated px-6 text-[11px] text-fg-muted">
              <span className="font-mono">
                {lookup(locale, 'p04.footer.showing', {
                  from: 1,
                  to: totalCount,
                  total: totalCount,
                })}
              </span>
              <span className="font-mono">
                {lookup(locale, 'p04.footer.perPage', { count: 50 })}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                  style={{ boxShadow: '0 0 6px var(--primary-glow)' }}
                />
                {lookup(locale, 'p04.notice.liveSync')}
              </span>
            </div>
          </>
        )}
      </div>

      <BatchUpdateDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        locale={locale}
        packages={outdated}
        onConfirm={confirmBatchUpdate}
        pending={batchUpdate.isPending}
      />

      <UninstallDialog
        open={uninstallTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUninstallTarget(null);
        }}
        locale={locale}
        pkg={uninstallTarget}
        onConfirm={confirmUninstall}
        pending={uninstallOne.isPending}
      />
    </div>
  );
}

export default InstalledAppsPage;