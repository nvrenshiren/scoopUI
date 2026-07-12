/**
 * P09 重置设置 · AlertDialog 二次确认
 * - 重置界面语言与主题为默认;不影响 Scoop / 桶 / 已装软件包
 * - 二次确认:AlertDialog(关闭按钮 + AlertDialogAction 提交)
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export interface DangerZoneProps {
  onConfirm: () => Promise<void> | void;
  busy?: boolean;
}

export function DangerZone({ onConfirm, busy }: DangerZoneProps) {
  const { t } = useTranslation('p09');
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive glow-destructive">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="font-display text-base font-semibold text-fg">
              {t('p09.section.danger')}
            </div>
            <div className="mt-1 text-xs text-fg-muted">
              {t('p09.section.danger.desc')}
            </div>
          </div>
        </div>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t('p09.section.danger.action')}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('p09.section.danger.confirm.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('p09.section.danger.confirm.desc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>
                {t('p09.section.danger.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} disabled={busy}>
                {t('p09.section.danger.confirm.submit')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
