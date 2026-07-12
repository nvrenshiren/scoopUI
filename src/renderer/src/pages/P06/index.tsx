import { useMemo, useState } from 'react';
import { Layers, Plus, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  useAddedBuckets,
  useAddBucket,
  useKnownBuckets,
  useRemoveBucket,
  mergeKnownWithAdded,
  countAddable,
} from './hooks/use-buckets';
import { useT } from './locales';
import { BucketTabs, type BucketTabValue } from './components/BucketTabs';
import { BucketTable } from './components/BucketTable';
import { AddBucketDialog } from './components/AddBucketDialog';
import { RemoveBucketDialog } from './components/RemoveBucketDialog';
import { ErrorBanner } from './components/ErrorBanner';
import type { KnownBucketRow } from './hooks/use-buckets';
import type { BucketInfo } from '../../../../shared/ipc-contract';

export interface P06PageProps {
  className?: string;
}

export default function P06Page({ className }: P06PageProps) {
  const t = useT();
  const [tab, setTab] = useState<BucketTabValue>('added');
  const [search, setSearch] = useState('');

  const added = useAddedBuckets();
  const known = useKnownBuckets();
  const addBucket = useAddBucket();
  const removeBucket = useRemoveBucket();

  const [addTarget, setAddTarget] = useState<KnownBucketRow | null>(null);
  const [removeTarget, setRemoveTarget] = useState<BucketInfo | null>(null);

  const filteredAdded = useMemo(() => filterBuckets(added.buckets, search), [added.buckets, search]);

  const knownRows = useMemo(() => mergeKnownWithAdded(known.buckets, added.buckets), [
    known.buckets,
    added.buckets,
  ]);
  const filteredKnown = useMemo(() => filterKnownRows(knownRows, search), [knownRows, search]);
  const addable = useMemo(() => countAddable(knownRows), [knownRows]);

  const handleRefreshAll = async () => {
    await Promise.all([added.refetch(), known.refetch()]);
  };

  const handleSyncKnown = async () => {
    await known.refetch();
  };

  const handleConfirmAdd = async (input: { name: string; repo?: string }) => {
    try {
      await addBucket.mutate(input);
      toast.success(t('toast.add.success', { name: input.name }));
      setAddTarget(null);
    } catch (err) {
      toast.error(toErrorMessage(err, t('toast.error.fallback')));
    }
  };

  const handleConfirmRemove = async (input: { name: string }) => {
    try {
      await removeBucket.mutate(input);
      toast.success(t('toast.remove.success', { name: input.name }));
      setRemoveTarget(null);
    } catch (err) {
      toast.error(toErrorMessage(err, t('toast.error.fallback')));
    }
  };

  const handleJumpToKnown = () => {
    setTab('known');
  };

  const handlePickFromKnown = () => {
    setTab('known');
    const next = knownRows.find((r) => !r.added);
    if (next) setAddTarget(next);
  };

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      <PageHeader
        title={t('page.title')}
        description={t('page.subtitle.addedKnown', {
          added: added.buckets.length,
          known: known.buckets.length,
        })}
        right={
          <span className="hidden items-center gap-1.5 font-mono text-xs text-fg-muted md:inline-flex">
            <span className="text-fg-subtle">{t('footer.showing')}</span>
            <span className="text-fg">
              {tab === 'added'
                ? `${filteredAdded.length}/${added.buckets.length}`
                : `${filteredKnown.length}/${knownRows.length}`}
            </span>
          </span>
        }
      />

      <SubToolbar
        search={search}
        onSearchChange={setSearch}
        knownCount={known.buckets.length}
        addableCount={addable}
        onRefresh={handleRefreshAll}
        onSyncKnown={handleSyncKnown}
        onPickFromKnown={handlePickFromKnown}
      />

      <BucketTabs
        value={tab}
        onChange={setTab}
        addedCount={added.buckets.length}
        knownCount={known.buckets.length}
      />

      <div
        className="relative flex-1 min-h-0 overflow-auto"
        role="tabpanel"
        id={tab === 'added' ? 'panel-added' : 'panel-known'}
      >
        {tab === 'added' ? (
          <AddedTabBody
            added={added}
            filteredAdded={filteredAdded}
            onRemove={(b) => setRemoveTarget(b)}
            onJumpToKnown={handleJumpToKnown}
          />
        ) : (
          <KnownTabBody
            known={known}
            filteredKnown={filteredKnown}
            onAdd={(row) => setAddTarget(row)}
          />
        )}
      </div>

      <Footer total={tab === 'added' ? added.buckets.length : knownRows.length} />

      <AddBucketDialog
        open={addTarget !== null}
        row={addTarget}
        busy={addBucket.isPending}
        onOpenChange={(o) => {
          if (!o) {
            setAddTarget(null);
            addBucket.reset();
          }
        }}
        onConfirm={handleConfirmAdd}
      />
      <RemoveBucketDialog
        open={removeTarget !== null}
        bucket={removeTarget}
        busy={removeBucket.isPending}
        onOpenChange={(o) => {
          if (!o) {
            setRemoveTarget(null);
            removeBucket.reset();
          }
        }}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}

interface SubToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  knownCount: number;
  addableCount: number;
  onRefresh: () => void;
  onSyncKnown: () => void;
  onPickFromKnown: () => void;
}

function SubToolbar({ search, onSearchChange, knownCount, addableCount, onRefresh, onSyncKnown, onPickFromKnown }: SubToolbarProps) {
  const t = useT();
  return (
    <>
      <div className="flex h-12 items-center justify-between gap-4 border-b border-border bg-bg-elevated px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative w-72 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('subbar.searchPlaceholder')}
              className="h-8 pl-9 text-sm"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 font-mono text-xs text-fg-muted">
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
              style={{ boxShadow: '0 0 6px var(--primary-glow)' }}
            />
            <span>{t('page.scoopOnline')}</span>
          </span>
        </div>
      </div>

      <div className="flex h-14 items-center justify-between gap-4 border-b border-border bg-bg px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            size="default"
            onClick={onPickFromKnown}
            className="glow-primary"
          >
            <Plus className="h-4 w-4" />
            <span>{t('subbar.cta.addFromKnown')}</span>
          </Button>
          <span className="ml-2 hidden items-center gap-1.5 text-xs text-fg-muted md:inline-flex">
            <AlertCircle className="h-3.5 w-3.5 text-accent" />
            <span>{t('subbar.hint', { known: knownCount, addable: addableCount })}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onSyncKnown}>
            <RefreshCw className="h-3 w-3" />
            <span>{t('subbar.syncKnown')}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <span>{t('subbar.help')}</span>
          </Button>
        </div>
      </div>
    </>
  );
}

interface AddedTabBodyProps {
  added: ReturnType<typeof useAddedBuckets>;
  filteredAdded: BucketInfo[];
  onRemove: (b: BucketInfo) => void;
  onJumpToKnown: () => void;
}

function AddedTabBody({ added, filteredAdded, onRemove, onJumpToKnown }: AddedTabBodyProps) {
  const t = useT();

  if (added.error) {
    return (
      <ErrorBanner
        variant="banner"
        message={added.error.message}
        code="E_SCOOP_SPAWN_FAILED"
        onRetry={() => void added.refetch()}
      />
    );
  }

  if (!added.isLoading && added.buckets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center" style={{ minHeight: 420 }}>
        <div
          className="relative mb-5 rounded-full p-5"
          style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--primary-glow), transparent)' }}
          />
          <Layers className="relative h-11 w-11 text-fg-muted" strokeWidth={1.25} />
        </div>
        <h3 className="font-display text-lg font-semibold">{t('table.empty.added.title')}</h3>
        <p className="mt-2 max-w-md text-sm text-fg-muted">{t('table.empty.added.desc')}</p>
        <Button size="default" className="mt-6 glow-primary" onClick={onJumpToKnown}>
          <span>{t('table.empty.added.cta')}</span>
        </Button>
      </div>
    );
  }

  if (!added.isLoading && filteredAdded.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-fg-muted">
        {t('common.empty')}
      </div>
    );
  }

  return (
    <BucketTable
      variant="added"
      added={filteredAdded}
      knownRows={[]}
      isLoading={added.isLoading}
      onAdd={() => undefined}
      onRemove={onRemove}
    />
  );
}

interface KnownTabBodyProps {
  known: ReturnType<typeof useKnownBuckets>;
  filteredKnown: KnownBucketRow[];
  onAdd: (row: KnownBucketRow) => void;
}

function KnownTabBody({ known, filteredKnown, onAdd }: KnownTabBodyProps) {
  if (known.error) {
    return (
      <ErrorBanner
        variant="banner"
        message={known.error.message}
        onRetry={() => void known.refetch()}
      />
    );
  }

  if (!known.isLoading && filteredKnown.length === 0 && known.buckets.length > 0) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-fg-muted">
        —
      </div>
    );
  }

  return (
    <BucketTable
      variant="known"
      added={[]}
      knownRows={filteredKnown}
      isLoading={known.isLoading}
      onAdd={onAdd}
      onRemove={() => undefined}
    />
  );
}

function Footer({ total }: { total: number }) {
  const t = useT();
  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-t border-border bg-bg-elevated px-6">
      <span className="text-xs text-fg-muted">
        {t('footer.showing')} <span className="font-mono text-fg">1-{total || 0}</span> {t('footer.of')}{' '}
        <span className="font-mono text-fg">{total}</span>
      </span>
      <span className="font-mono text-xs text-fg-subtle">
        {t('footer.perPage')}: 50
      </span>
    </div>
  );
}

function filterBuckets(buckets: BucketInfo[], query: string): BucketInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return buckets;
  return buckets.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.source.toLowerCase().includes(q),
  );
}

function filterKnownRows(rows: KnownBucketRow[], query: string): KnownBucketRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      (r.repo && r.repo.toLowerCase().includes(q)),
  );
}

function toErrorMessage(e: unknown, fallback = 'Unknown error'): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  if (typeof e === 'string' && e.length > 0) return e;
  return fallback;
}