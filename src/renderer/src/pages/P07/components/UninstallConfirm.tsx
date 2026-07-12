import { AlertTriangle } from 'lucide-react';
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
import { pickLocale, type Lang } from '../locales';

export interface UninstallConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  version: string;
  lang: Lang;
  onConfirm: () => void;
  pending?: boolean;
}

export function UninstallConfirm({
  open,
  onOpenChange,
  name,
  version,
  lang,
  onConfirm,
  pending,
}: UninstallConfirmProps) {
  const t = pickLocale(lang);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="card-top-line relative max-w-md gap-0 overflow-hidden p-0">
        <div className="px-6 pt-6 pb-4">
          <AlertDialogHeader className="flex-row items-start gap-3 space-y-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="font-display text-lg font-semibold leading-tight text-fg">
                {t.uninstallConfirmTitle}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                {t.uninstallConfirmBody(name, version)}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
        </div>

        <div className="px-6 pb-2">
          <div
            className="rounded-md border border-border bg-bg-overlay p-3 text-xs"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <div className="mb-1 text-fg-muted">{t.uninstallCommandPreview}:</div>
            <div className="text-fg">
              <span className="text-fg-muted">$</span>{' '}
              {t.uninstallCommandLine} <span className="text-primary">{name}</span>{' '}
              {t.commandPreviewTail}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="mt-2 border-t border-border px-6 py-4">
          <AlertDialogCancel className="mt-0">{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:opacity-90 glow-destructive"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              if (pending) return;
              onConfirm();
            }}
          >
            {t.confirmUninstall}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}