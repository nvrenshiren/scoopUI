// 通用确认对话框(卸载确认 / 批量更新清单确认 / 移除桶确认)
import { t } from "@/i18n";
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
      <DialogContent
        className="w-[min(480px,calc(100vw-64px))]"
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {message && <DialogDescription className="whitespace-pre-wrap">{message}</DialogDescription>}
        </DialogHeader>
        {items && items.length > 0 && (
          <div className="mx-6 mt-3 max-h-[200px] overflow-auto rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs leading-7">
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
