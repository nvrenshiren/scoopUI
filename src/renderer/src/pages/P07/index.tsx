import { useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePackageDialogStore, type PackageDialogMeta } from './store/package-dialog-store';
import { usePackageDetail } from './hooks/use-package-detail';
import { usePackageDialogLang, pickLocale } from './locales';
import { PackageHeader, type PackageHeaderStatus } from './components/PackageHeader';
import { PackageFields } from './components/PackageFields';
import { ActionFooter } from './components/ActionFooter';
import { UninstallConfirm } from './components/UninstallConfirm';
import { ReadError } from './components/ReadError';

export interface PackageDetailDialogProps {
  packageId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  meta?: PackageDialogMeta;
}

type ActionablePackageStatus = Exclude<PackageHeaderStatus, 'read-failed'>;

function toActionableStatus(status: PackageHeaderStatus): ActionablePackageStatus {
  return status === 'read-failed' ? 'unavailable' : status;
}

export function PackageDetailDialog(props: PackageDetailDialogProps = {}) {
  const lang = usePackageDialogLang();
  const t = pickLocale(lang);

  const storeId = usePackageDialogStore((s) => s.openPackageId);
  const storeMeta = usePackageDialogStore((s) => s.meta);
  const closeStore = usePackageDialogStore((s) => s.closeDialog);

  const externalId = props.packageId ?? null;
  const externalOpen = props.open;
  const externalOnChange = props.onOpenChange;

  const activeId = externalOpen === undefined ? storeId : externalId ?? storeId;
  const isControlled = typeof externalOpen === 'boolean';
  const open = isControlled ? externalOpen : activeId !== null;

  const meta = externalOpen === undefined ? storeMeta : props.meta ?? storeMeta;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (externalOnChange) externalOnChange(false);
      else closeStore();
    }
  };

  const handleClose = () => {
    if (externalOnChange) externalOnChange(false);
    else closeStore();
  };

  const { detail, isLoading, isError, error, refetch } = usePackageDetail(activeId);

  const status: PackageHeaderStatus = useMemo(() => {
    if (isError) return 'read-failed';
    if (meta.conflict) return 'unavailable';
    if (meta.outdated === true) return 'installed-outdated';
    if (meta.installed === true || (detail && detail.version && detail.version.length > 0)) {
      return 'installed-latest';
    }
    return 'installable';
  }, [isError, meta.conflict, meta.outdated, meta.installed, detail]);

  const actionStatus = toActionableStatus(status);

  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [actionPending, setActionPending] = useState<'install' | 'update' | null>(null);
  const [uninstallPending, setUninstallPending] = useState(false);

  const name = activeId ?? '';
  const version = detail?.version ?? '';
  const latestVersion =
    meta.latestVersion ?? (status === 'installed-outdated' ? version : undefined);

  const handleInstall = async () => {
    if (!activeId) return;
    if (typeof window === 'undefined' || !window.scoop) return;
    setActionPending('install');
    try {
      await window.scoop.installApp({
        name: activeId,
        bucket: detail?.source,
        global: false,
      });
      handleClose();
    } finally {
      setActionPending(null);
    }
  };

  const handleUpdate = async () => {
    if (!activeId) return;
    if (typeof window === 'undefined' || !window.scoop) return;
    setActionPending('update');
    try {
      await window.scoop.updateApp({ name: activeId, global: false });
      handleClose();
    } finally {
      setActionPending(null);
    }
  };

  const handleUninstall = () => {
    setShowUninstallConfirm(true);
  };

  const handleConfirmUninstall = async () => {
    if (!activeId) return;
    if (typeof window === 'undefined' || !window.scoop) return;
    setUninstallPending(true);
    try {
      await window.scoop.uninstallApp({ name: activeId, global: false });
      setShowUninstallConfirm(false);
      handleClose();
    } finally {
      setUninstallPending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          hideClose
          className="card-top-line relative max-w-2xl gap-0 overflow-hidden p-0"
        >
          <PackageHeader
            status={status}
            name={name}
            version={version || t.dash}
            latestVersion={latestVersion}
            lang={lang}
          />

          <button
            type="button"
            aria-label={t.ariaClose}
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-fg-muted transition-colors hover:bg-bg-overlay hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>

          <DialogTitle className="sr-only">{t.title}</DialogTitle>
          <DialogDescription className="sr-only">{t.title}</DialogDescription>

          {isLoading ? (
            <div className="flex items-center justify-center px-6 py-12 text-fg-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              <span className="text-sm">{t.loading}</span>
            </div>
          ) : isError ? (
            <ReadError
              name={name}
              lang={lang}
              errorCode={error?.code}
              errorMessage={error?.message}
              onRetry={() => void refetch()}
              onClose={handleClose}
              retrying={isLoading}
            />
          ) : status === 'unavailable' ? (
            <>
              <PackageFields
                detail={detail}
                status="unavailable"
                lang={lang}
                conflict={meta.conflict}
              />
              <ActionFooter
                status="unavailable"
                lang={lang}
                name={name}
                onInstall={() => undefined}
                onUninstall={() => undefined}
                onUpdate={() => undefined}
              />
            </>
          ) : (
            <>
              <PackageFields
                detail={detail}
                status={actionStatus}
                lang={lang}
                latestVersion={latestVersion}
              />
              <ActionFooter
                status={actionStatus}
                lang={lang}
                name={name}
                latestVersion={latestVersion}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                onUpdate={handleUpdate}
              />
            </>
          )}
          {actionPending ? <PendingHint pending={actionPending} /> : null}
        </DialogContent>
      </Dialog>

      <UninstallConfirm
        open={showUninstallConfirm}
        onOpenChange={setShowUninstallConfirm}
        name={name}
        version={version || t.dash}
        lang={lang}
        onConfirm={handleConfirmUninstall}
        pending={uninstallPending}
      />
    </>
  );
}

function PendingHint({ pending }: { pending: 'install' | 'update' }) {
  return (
    <span className="sr-only" role="status">
      {pending === 'install' ? 'installing' : 'updating'}
    </span>
  );
}

export default PackageDetailDialog;