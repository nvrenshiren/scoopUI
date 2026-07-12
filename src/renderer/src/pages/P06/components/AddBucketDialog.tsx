import { useEffect, useState } from 'react';
import { Info, Layers, Plus, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '../locales';
import type { KnownBucketRow } from '../hooks/use-buckets';

export interface AddBucketDialogProps {
  open: boolean;
  row: KnownBucketRow | null;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { name: string; repo?: string }) => Promise<void> | void;
}

export function AddBucketDialog({ open, row, busy, onOpenChange, onConfirm }: AddBucketDialogProps) {
  const t = useT();
  const [repo, setRepo] = useState('');

  useEffect(() => {
    if (open) {
      setRepo(row?.repo ?? '');
    }
  }, [open, row]);

  const repoPath = row?.repo ? row.repo.replace(/^https?:\/\//, '') : '';

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!row) return;
    const trimmed = repo.trim();
    await onConfirm({
      name: row.name,
      repo: trimmed.length > 0 ? trimmed : row.repo,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="relative max-w-[520px] gap-0 overflow-hidden p-0"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          aria-hidden="true"
          className="h-0.5 w-full"
          style={{
            background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--primary))',
          }}
        />
        <div className="absolute left-[20%] right-[20%] top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
        <AlertDialogHeader className="px-6 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary bg-primary/15 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="flex flex-wrap items-baseline gap-2 text-lg">
                {row ? (
                  <>
                    {t('dialog.add.title')}{' '}
                    <span className="font-mono text-primary">{row.name}</span>?
                  </>
                ) : (
                  t('dialog.add.title')
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-fg-muted">
                {row
                  ? t('dialog.add.desc', { source: row.repo ? row.repo.replace(/^https?:\/\//, '') : row.name })
                  : ''}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 px-6 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <div className="uppercase tracking-wide text-fg-muted">{t('dialog.add.meta.source')}</div>
              <div className="mt-0.5 truncate font-mono text-fg">{repoPath || '—'}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg-muted" htmlFor="add-bucket-repo">
              Repo URL
            </label>
            <Input
              id="add-bucket-repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder={row?.repo ?? 'https://github.com/owner/bucket'}
              disabled={busy}
              spellCheck={false}
              autoComplete="off"
            />
            <p className="text-[11px] text-fg-subtle">可选 · 留空使用已知桶官方默认仓库</p>
          </div>

          <div
            className="flex items-start gap-2 rounded-md px-3 py-2 text-xs"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" />
            <span className="text-fg-muted">{t('dialog.add.notice')}</span>
          </div>
        </div>

        <AlertDialogFooter className="border-t border-border px-6 pb-6 pt-4">
          <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={busy || !row}
            className="glow-primary"
          >
            {busy ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>{t('common.loading')}…</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>{t('dialog.add.confirm')}</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}