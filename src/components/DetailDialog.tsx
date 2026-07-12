// P07 · 软件包详情对话框:scoop info 键值 + 随状态变化的操作按钮
import { useEffect, useMemo, useState } from "react";
import { CircleArrowUp, Check, Download, LoaderCircle, Package, Trash2, TriangleAlert } from "lucide-react";

import { api } from "@/api";
import { t, tf } from "@/i18n";
import { enqueue, selectBusyTargets, selectOutdatedNames, useApp, useLang } from "@/store";
import { bucketNameOf } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DetailDialog() {
  useLang();
  const name = useApp((s) => s.detailName);
  const jobs = useApp((s) => s.jobs);
  const installed = useApp((s) => s.installed);
  const statusEntries = useApp((s) => s.statusEntries);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [retryTick, setRetryTick] = useState(0);
  const [updateAsk, setUpdateAsk] = useState(false);

  useEffect(() => {
    if (!name) return;
    let stale = false;
    setLoading(true);
    setError("");
    setPairs([]);
    api
      .info(name)
      .then((p) => !stale && setPairs(p))
      .catch((e) => !stale && setError(String(e)))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [name, retryTick]);

  const isInstalled = useMemo(() => installed.some((a) => a.name === name), [installed, name]);
  const isOutdated = useMemo(() => selectOutdatedNames(statusEntries).has(name), [statusEntries, name]);
  const busy = useMemo(() => selectBusyTargets(jobs).has(name), [jobs, name]);

  const version = pairs.find(([k]) => k === "Version")?.[1] ?? "";
  const website = pairs.find(([k]) => k === "Website")?.[1] ?? "";

  const close = () => useApp.setState({ detailName: "" });

  function act(kind: "install" | "update") {
    void enqueue(kind, name);
    close();
  }

  function askUninstall() {
    useApp.setState({ detailName: "", view: "installed", uninstallAsk: name });
  }

  return (
    <Dialog open={!!name} onOpenChange={(v) => !v && close()}>
      <DialogContent aria-describedby={undefined}>
        {/* 头部:图标 + 名称 + 版本(mono)+ 状态 Badge(设计系统 §10.3) */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[var(--primary-glow)] bg-[var(--primary-glow-soft)] text-primary">
            <Package className="size-[22px]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <h3 className="font-mono text-lg font-semibold">{name}</h3>
            {version && <span className="font-mono text-[13px] text-muted-foreground">{version}</span>}
            {isOutdated ? (
              <Badge variant="warning">
                <TriangleAlert />
                {t("installed.outdated")}
              </Badge>
            ) : (
              isInstalled && (
                <Badge variant="success">
                  <Check />
                  {t("browse.installedBadge")}
                </Badge>
              )
            )}
          </div>
        </div>

        <div className="min-h-[120px] overflow-auto px-6 py-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              {t("detail.loading")}
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 py-4 text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                {t("detail.failed")}
                <div className="mt-1 font-mono text-xs break-all select-text">{error}</div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() => setRetryTick((n) => n + 1)}
                >
                  {t("common.retry")}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="my-2 grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-[13px]">
              {pairs.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-subtle">{tf("detail.field." + key, key)}</dt>
                  <dd
                    className={
                      "m-0 break-words whitespace-pre-wrap select-text " +
                      (key !== "Description" && key !== "Notes" ? "font-mono" : "")
                    }
                  >
                    {key === "Website" && website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-info hover:underline"
                      >
                        {value}
                      </a>
                    ) : key === "Source" || key === "Bucket" ? (
                      <span title={value}>{bucketNameOf(value)}</span>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={close}>
            {t("common.close")}
          </Button>
          {busy ? (
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              {t("common.loading")}
            </span>
          ) : !isInstalled ? (
            <Button onClick={() => act("install")}>
              <Download className="size-4" />
              {t("common.install")}
            </Button>
          ) : (
            <>
              <Button variant="destructive" onClick={askUninstall}>
                <Trash2 className="size-4" />
                {t("common.uninstall")}
              </Button>
              {isOutdated && (
                <Button onClick={() => setUpdateAsk(true)}>
                  <CircleArrowUp className="size-4" />
                  {t("common.update")}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>

      <ConfirmDialog
        open={updateAsk}
        title={t("installed.updateTitle")}
        message={t("installed.updateDesc", { name })}
        confirmText={t("common.update")}
        onConfirm={() => {
          setUpdateAsk(false);
          act("update");
        }}
        onCancel={() => setUpdateAsk(false)}
      />
    </Dialog>
  );
}
