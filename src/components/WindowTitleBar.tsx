import { useEffect, useMemo, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri } from "@tauri-apps/api/core";

import { t } from "@/i18n";
import { Button } from "@/components/ui/button";

export function WindowTitleBar() {
  const appWindow = useMemo(() => (isTauri() ? getCurrentWindow() : null), []);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!appWindow) return;

    let active = true;
    let unlisten: (() => void) | undefined;
    const updateMaximized = () => {
      void appWindow.isMaximized().then((value) => {
        if (active) setMaximized(value);
      }).catch(() => undefined);
    };

    updateMaximized();
    void appWindow.onResized(updateMaximized).then((dispose) => {
      if (active) unlisten = dispose;
      else dispose();
    }).catch(() => undefined);

    return () => {
      active = false;
      unlisten?.();
    };
  }, [appWindow]);

  if (!appWindow) return null;

  const toggleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
      setMaximized(await appWindow.isMaximized());
    } catch { /* Window action failed; leave the app usable. */ }
  };

  const runWindowAction = (action: () => Promise<void>) => {
    void action().catch(() => undefined);
  };

  return (
    <div className="flex h-10 shrink-0 items-stretch border-b border-border/75 bg-card/90">
      <div
        className="flex min-w-0 flex-1 cursor-default items-center gap-2 px-4 text-xs font-medium text-muted-foreground"
        data-tauri-drag-region
        onDoubleClick={() => void toggleMaximize()}
      >
        <span className="font-heading tracking-[-0.01em] text-foreground" data-tauri-drag-region>scoopUI</span>
      </div>
      <div className="flex shrink-0 items-stretch">
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          title={t("window.minimize")}
          aria-label={t("window.minimize")}
          className="h-10 w-11 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:z-10"
          onClick={() => runWindowAction(() => appWindow.minimize())}
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          title={maximized ? t("window.restore") : t("window.maximize")}
          aria-label={maximized ? t("window.restore") : t("window.maximize")}
          className="h-10 w-11 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:z-10"
          onClick={() => void toggleMaximize()}
        >
          {maximized
            ? <Copy className="size-3.5" aria-hidden="true" />
            : <Square className="size-3.5" aria-hidden="true" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          title={t("window.close")}
          aria-label={t("window.close")}
          className="h-10 w-12 rounded-none text-muted-foreground hover:bg-destructive-solid hover:text-destructive-foreground focus-visible:z-10"
          onClick={() => runWindowAction(() => appWindow.close())}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
