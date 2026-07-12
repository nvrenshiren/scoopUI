import { CheckCircle2, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { lookup, type Locale } from '../locales';
import type { InstalledPackage } from '../hooks/use-installed-packages';

interface UpdateActionsProps {
  locale: Locale;
  outdated: InstalledPackage[];
  outdatedCount: number;
  selectedNames: string[];
  onUpdateAll: () => void;
  onUpdateSelected: () => void;
  onUninstallSelected: () => void;
  batchUpdating: boolean;
  batchUninstalling: boolean;
}

export function UpdateActions({
  locale,
  outdated,
  outdatedCount,
  selectedNames,
  onUpdateAll,
  onUpdateSelected,
  onUninstallSelected,
  batchUpdating,
  batchUninstalling,
}: UpdateActionsProps) {
  const selectedCount = selectedNames.length;
  const outdatedSelected = selectedNames.filter((n) =>
    outdated.some((p) => p.name === n),
  ).length;

  return (
    <div
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-6"
      style={{ background: 'var(--bg)' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="default"
          size="default"
          onClick={onUpdateAll}
          disabled={outdated.length === 0 || batchUpdating}
          className="gap-2 glow-primary"
        >
          {batchUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" strokeWidth={2} aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4 text-black" strokeWidth={2} aria-hidden />
          )}
          {lookup(locale, 'p04.actions.updateAll')}
          <span
            className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold leading-none"
            style={{ background: 'rgba(6,40,26,0.4)', color: '#06281A' }}
          >
            {outdated.length}
          </span>
        </Button>

        {outdatedCount > 0 && (
          <div className="hidden items-center gap-1.5 text-[12px] text-fg-muted md:flex">
            <CheckCircle2
              className="h-3.5 w-3.5 text-warning"
              strokeWidth={2}
              aria-hidden
            />
            <span>
              <b className="font-mono font-semibold text-warning">{outdatedCount}</b>{' '}
              <span>{lookup(locale, 'p04.status.outdated')}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUpdateSelected}
          disabled={outdatedSelected === 0 || batchUpdating}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
          {lookup(locale, 'p04.actions.updateSelected')} ({outdatedSelected})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUninstallSelected}
          disabled={selectedCount === 0 || batchUninstalling}
          className="gap-1.5 text-fg-muted hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
          {lookup(locale, 'p04.actions.uninstallSelected')} ({selectedCount})
        </Button>
      </div>
    </div>
  );
}

interface BatchUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  packages: InstalledPackage[];
  onConfirm: () => void;
  pending: boolean;
}

export function BatchUpdateDialog({
  open,
  onOpenChange,
  locale,
  packages,
  onConfirm,
  pending,
}: BatchUpdateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[520px]">
        <AlertDialogHeader>
          <div className="mb-1 flex items-start gap-3">
            <div
              className="rounded-full p-2"
              style={{
                background: 'var(--primary-glow)',
                border: '1px solid var(--primary)',
              }}
            >
              <RefreshCw className="h-5 w-5 text-primary" strokeWidth={1.6} aria-hidden />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>
                {lookup(locale, 'p04.dialog.updateAll.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {lookup(locale, 'p04.dialog.updateAll.desc', { count: packages.length })}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-fg-muted">
            {lookup(locale, 'p04.dialog.updateAll.listLabel')}
          </div>
          <ul
            className="max-h-[200px] space-y-1 overflow-auto rounded-md p-2 font-mono text-[12px]"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
            }}
          >
            {packages.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-2 rounded-sm px-2 py-1 hover:bg-bg-elevated"
              >
                <span className="text-fg">{p.name}</span>
                <span className="text-[10.5px] text-fg-subtle">
                  {p.version} →{' '}
                  <span className="text-warning">{p.outdated?.latest}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {lookup(locale, 'p04.actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending || packages.length === 0}
            className="gap-2 glow-primary"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />}
            {lookup(locale, 'p04.actions.confirmUpdate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UninstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  pkg: InstalledPackage | null;
  onConfirm: () => void;
  pending: boolean;
}

export function UninstallDialog({
  open,
  onOpenChange,
  locale,
  pkg,
  onConfirm,
  pending,
}: UninstallDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[480px]">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div
              className="rounded-full p-2"
              style={{
                background: 'var(--destructive-glow)',
                border: '1px solid var(--destructive)',
              }}
            >
              <Trash2 className="h-5 w-5 text-destructive" strokeWidth={1.6} aria-hidden />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>
                {pkg
                  ? lookup(locale, 'p04.dialog.uninstall.title', { name: pkg.name })
                  : lookup(locale, 'p04.row.action.uninstall')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pkg &&
                  lookup(locale, 'p04.dialog.uninstall.desc', {
                    name: pkg.name,
                    version: pkg.version,
                  })}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div
          className="flex items-start gap-2 rounded-md px-3 py-2 text-[12px] text-fg-muted"
          style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border)',
          }}
        >
          <span>{lookup(locale, 'p04.dialog.uninstall.note')}</span>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {lookup(locale, 'p04.actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!pkg || pending}
            className="gap-2 bg-destructive text-white hover:opacity-90 glow-destructive"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />}
            {lookup(locale, 'p04.actions.confirmUninstall')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}