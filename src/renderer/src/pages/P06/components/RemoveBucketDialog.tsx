import { AlertTriangle, Info, RefreshCw, Trash2 } from 'lucide-react';
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
import { useT } from '../locales';
import type { BucketInfo } from '../../../../../shared/ipc-contract';

export interface RemoveBucketDialogProps {
  open: boolean;
  bucket: BucketInfo | null;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { name: string }) => Promise<void> | void;
}

export function RemoveBucketDialog({ open, bucket, busy, onOpenChange, onConfirm }: RemoveBucketDialogProps) {
  const t = useT();

  const repoPath = bucket?.source ? bucket.source.replace(/^https?:\/\//, '') : '';

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!bucket) return;
    await onConfirm({ name: bucket.name });
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
          style={{ background: 'linear-gradient(90deg, var(--destructive), var(--accent), var(--destructive))' }}
        />
        <div className="absolute left-[20%] right-[20%] top-0 h-px bg-gradient-to-r from-transparent via-destructive to-transparent opacity-60" />
        <AlertDialogHeader className="px-6 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-destructive bg-destructive/15 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="flex flex-wrap items-baseline gap-2 text-lg">
                {bucket ? (
                  <>
                    {t('dialog.remove.title')}{' '}
                    <span className="font-mono text-destructive">{bucket.name}</span>?
                  </>
                ) : (
                  t('dialog.remove.title')
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-fg-muted">
                {bucket ? t('dialog.remove.desc', { name: bucket.name }) : ''}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 px-6 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <div className="uppercase tracking-wide text-fg-muted">{t('dialog.remove.meta.source')}</div>
              <div className="mt-0.5 truncate font-mono text-fg">{repoPath || '—'}</div>
            </div>
            <div>
              <div className="uppercase tracking-wide text-fg-muted">{t('dialog.remove.meta.apps')}</div>
              <div className="mt-0.5 font-mono text-fg">
                {bucket?.manifests !== undefined ? bucket.manifests.toLocaleString() : '—'}
              </div>
            </div>
          </div>

          <div
            className="flex items-start gap-2 rounded-md px-3 py-2 text-xs"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" />
            <span className="text-fg-muted">{t('dialog.remove.notice')}</span>
          </div>
        </div>

        <AlertDialogFooter className="border-t border-border px-6 pb-6 pt-4">
          <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={busy || !bucket}
            className="glow-destructive"
          >
            {busy ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>{t('common.loading')}…</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t('dialog.remove.confirm')}</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}