import { Layers, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { BucketInfo, KnownBucketRow } from '../hooks/use-buckets';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '../locales';

export type BucketTableVariant = 'added' | 'known';

export interface BucketTableProps {
  variant: BucketTableVariant;
  added: BucketInfo[];
  knownRows: KnownBucketRow[];
  isLoading: boolean;
  onAdd: (row: KnownBucketRow) => void;
  onRemove: (bucket: BucketInfo) => void;
  onRefreshBucket?: (name: string) => void;
}

export function BucketTable({
  variant,
  added,
  knownRows,
  isLoading,
  onAdd,
  onRemove,
  onRefreshBucket,
}: BucketTableProps) {
  const t = useT();

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-fg-muted">
        {t('common.loading')}…
      </div>
    );
  }

  if (variant === 'added') {
    if (added.length === 0) return null;
    return (
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '22%', minWidth: 180 }} />
          <col style={{ width: '30%', minWidth: 240 }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '20%', minWidth: 180 }} />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-bg-elevated border-b border-border">
          <tr style={{ height: 40 }}>
            <th className="px-4 text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
              {t('table.col.name')}
            </th>
            <th className="px-3 text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
              {t('table.col.source')}
            </th>
            <th className="px-3 text-right text-xs font-medium uppercase tracking-wide text-fg-muted">
              {t('table.col.apps')}
            </th>
            <th className="px-3 text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
              {t('table.col.updated')}
            </th>
            <th className="px-4 text-right text-xs font-medium uppercase tracking-wide text-fg-muted">
              {t('table.col.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {added.map((b) => (
            <AddedRow key={b.name} bucket={b} onRemove={onRemove} onRefresh={onRefreshBucket} />
          ))}
        </tbody>
      </table>
    );
  }

  if (knownRows.length === 0) return null;

  return (
    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '22%', minWidth: 180 }} />
        <col style={{ width: '30%', minWidth: 240 }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '20%', minWidth: 180 }} />
      </colgroup>
      <thead className="sticky top-0 z-10 bg-bg-elevated border-b border-border">
        <tr style={{ height: 40 }}>
          <th className="px-4 text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
            {t('table.col.name')}
          </th>
          <th className="px-3 text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
            {t('table.col.source')}
          </th>
          <th className="px-3 text-right text-xs font-medium uppercase tracking-wide text-fg-muted">
            {t('table.col.apps')}
          </th>
          <th className="px-3 text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
            {t('table.col.status')}
          </th>
          <th className="px-4 text-right text-xs font-medium uppercase tracking-wide text-fg-muted">
            {t('table.col.actions')}
          </th>
        </tr>
      </thead>
      <tbody>
        {knownRows.map((row) => (
          <KnownRow key={row.name} row={row} onAdd={onAdd} />
        ))}
      </tbody>
    </table>
  );
}

interface AddedRowProps {
  bucket: BucketInfo;
  onRemove: (bucket: BucketInfo) => void;
  onRefresh?: (name: string) => void;
}

function AddedRow({ bucket, onRemove, onRefresh }: AddedRowProps) {
  const t = useT();
  const repoPath = bucket.source.replace(/^https?:\/\//, '');
  return (
    <tr className="group h-10 border-b border-border transition-colors hover:bg-bg-overlay">
      <td className="px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate font-medium font-display">{bucket.name}</span>
          <span className="inline-flex h-5 items-center rounded-sm border border-primary/30 bg-primary/15 px-2 text-[11px] font-medium text-primary">
            {t('table.status.added')}
          </span>
        </div>
      </td>
      <td className="truncate px-3 font-mono text-xs text-fg-muted">{repoPath}</td>
      <td className="px-3 text-right font-mono text-sm tabular-nums">
        {bucket.manifests !== undefined ? bucket.manifests.toLocaleString() : '—'}
      </td>
      <td className="px-3 font-mono text-xs text-fg-muted">{bucket.updated ?? '—'}</td>
      <td className="px-4">
        <div className="flex items-center justify-end gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onRefresh(bucket.name)}
              title={t('table.action.refresh')}
            >
              <RefreshCw className="h-3 w-3" />
              <span>{t('table.action.refresh')}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive"
            onClick={() => onRemove(bucket)}
            title={t('table.action.remove')}
          >
            <Trash2 className="h-3 w-3" />
            <span>{t('table.action.remove')}</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface KnownRowProps {
  row: KnownBucketRow;
  onAdd: (row: KnownBucketRow) => void;
}

function KnownRow({ row, onAdd }: KnownRowProps) {
  const t = useT();
  const repoPath = row.repo ? row.repo.replace(/^https?:\/\//, '') : '—';
  return (
    <tr className="group h-10 border-b border-border transition-colors hover:bg-bg-overlay">
      <td className="px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className={cn('h-3.5 w-3.5 shrink-0', row.added ? 'text-primary' : 'text-fg-muted')} />
          <span className="truncate font-medium font-display">{row.name}</span>
        </div>
      </td>
      <td className="truncate px-3 font-mono text-xs text-fg-muted">{repoPath}</td>
      <td className="px-3 text-right font-mono text-sm text-fg-muted">—</td>
      <td className="px-3">
        {row.added ? (
          <span className="inline-flex h-5 items-center rounded-sm border border-primary/30 bg-primary/15 px-2 text-[11px] font-medium text-primary">
            {t('table.status.added')}
          </span>
        ) : (
          <span className="inline-flex h-5 items-center rounded-sm border border-border bg-bg-overlay px-2 text-[11px] font-medium text-fg-muted">
            {t('table.status.notAdded')}
          </span>
        )}
      </td>
      <td className="px-4">
        <div className="flex items-center justify-end gap-1">
          {row.added ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled
              title={t('table.action.addedDisabled')}
            >
              {t('table.action.addedDisabled')}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => onAdd(row)}
              title={t('table.action.add')}
            >
              <Plus className="h-3 w-3" />
              <span>{t('table.action.add')}</span>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}