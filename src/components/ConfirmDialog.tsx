// 通用确认对话框(卸载确认 / 批量更新清单确认 / 移除桶确认)
import { t } from "@/i18n";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  title,
  message,
  items,
  destructive,
  confirmText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  items?: string[];
  destructive?: boolean;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="w-[min(480px,calc(100vw-32px))]">
        <DialogHeader className="gap-3.5 pb-1">
          <div className="flex items-start gap-3">
            <span className={destructive
              ? "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-destructive/20 bg-[var(--destructive-glow)] text-destructive"
              : "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-accent text-accent-foreground"}>
              {destructive ? <TriangleAlert className="size-4" /> : <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
            </span>
            <div className="min-w-0 pr-5">
              <DialogTitle>{title}</DialogTitle>
              {message && <DialogDescription className="mt-1.5 whitespace-pre-wrap leading-5">{message}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        {items && items.length > 0 && (
          <div className="mx-6 mt-3 max-h-[200px] overflow-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs leading-7">
            {items.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmText ?? t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
