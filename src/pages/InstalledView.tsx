// P04 · 已装软件包列表页(F01 已装部分 / F03 / F04 / F06 / F07 / F08)
import { useMemo, useState } from "react";
import { Check, CircleArrowUp, LoaderCircle, RefreshCw, Search, TriangleAlert } from "lucide-react";

import { t } from "@/i18n";
import {
  enqueue,
  refreshInstalled,
  refreshStatus,
  selectBusyTargets,
  selectOutdatedNames,
  useApp,
  useLang,
} from "@/store";
import { bucketNameOf } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

export function InstalledView() {
  useLang();
  const installed = useApp((s) => s.installed);
  const statusEntries = useApp((s) => s.statusEntries);
  const jobs = useApp((s) => s.jobs);
  const loading = useApp((s) => s.loading);
  const errors = useApp((s) => s.errors);
  const uninstallAsk = useApp((s) => s.uninstallAsk);

  const [filter, setFilter] = useState("");
  const [updateAllOpen, setUpdateAllOpen] = useState(false);
  const [updateAsk, setUpdateAsk] = useState("");

  const outdated = useMemo(() => selectOutdatedNames(statusEntries), [statusEntries]);
  const busy = useMemo(() => selectBusyTargets(jobs), [jobs]);
  const statusByName = useMemo(() => {
    const map = new Map(statusEntries.map((e) => [e.name, e]));
    return map;
  }, [statusEntries]);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return installed.filter((a) => !q || a.name.toLowerCase().includes(q));
  }, [installed, filter]);

  const outdatedList = useMemo(
    () => installed.filter((a) => outdated.has(a.name)).map((a) => a.name),
    [installed, outdated],
  );

  function refresh() {
    void refreshInstalled();
    void refreshStatus();
  }

  function confirmUpdateAll() {
    setUpdateAllOpen(false);
    // flow §1.6:一次性确认清单后,逐项生成 InstallJob
    for (const name of outdatedList) void enqueue("update", name);
  }

  function confirmUninstall() {
    const name = uninstallAsk;
    useApp.setState({ uninstallAsk: "" });
    if (name) void enqueue("uninstall", name);
  }

  function confirmUpdate() {
    const name = updateAsk;
    setUpdateAsk("");
    if (name) void enqueue("update", name);
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="bg-grid relative px-7 pt-6 pb-4">
        <div className="bg-glow-top pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">{t("installed.title")}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("installed.desc")}</p>
          </div>
          <Button variant="outline" disabled={loading.status} onClick={() => void refreshStatus()}>
            {loading.status ? (
              <LoaderCircle className="size-4 animate-spin text-primary" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("installed.checkUpdates")}
          </Button>
          <Button disabled={!outdatedList.length} onClick={() => setUpdateAllOpen(true)}>
            <CircleArrowUp className="size-4" />
            {t("installed.updateAll")}
            {outdatedList.length > 0 && (
              <span className="rounded-sm bg-black/25 px-1.5 text-xs">{outdatedList.length}</span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-7 pb-6">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute top-3 left-3 size-4 text-subtle" />
            <Input
              className="pl-9"
              placeholder={t("installed.filter")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" aria-label={t("common.refresh")} onClick={refresh}>
            <RefreshCw className="size-4" />
          </Button>
        </div>

        {loading.installed && installed.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            {t("common.loading")}
          </div>
        ) : errors.installed ? (
          <EmptyState error title={t("error.readFailed")} hint={t("error.scoopUnavailable")}>
            <Button variant="secondary" onClick={refresh}>
              <RefreshCw className="size-4" />
              {t("common.refresh")}
            </Button>
          </EmptyState>
        ) : rows.length === 0 ? (
          installed.length === 0 ? (
            <EmptyState title={t("installed.empty")} hint={t("installed.emptyHint")} />
          ) : (
            <EmptyState title={t("installed.noMatch")} hint={t("installed.noMatchHint")} />
          )
        ) : (
          <TableWrap className="min-h-0 flex-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.version")}</TableHead>
                  <TableHead>{t("installed.latest")}</TableHead>
                  <TableHead>{t("common.source")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((app) => {
                  const isOutdated = outdated.has(app.name);
                  const isBusy = busy.has(app.name);
                  return (
                    <TableRow
                      key={app.name}
                      tabIndex={0}
                      role="button"
                      className={isOutdated ? "cursor-pointer bg-[var(--warning-soft)]" : "cursor-pointer"}
                      onClick={() => useApp.setState({ detailName: app.name })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          useApp.setState({ detailName: app.name });
                        }
                      }}
                    >
                      <TableCell className="font-mono font-medium">{app.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{app.version}</TableCell>
                      <TableCell className="font-mono">
                        {isOutdated ? (
                          <span className="text-warning">{statusByName.get(app.name)?.latestVersion}</span>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground" title={app.source}>
                        {bucketNameOf(app.source)}
                      </TableCell>
                      <TableCell>
                        {isBusy ? (
                          <Badge variant="info">
                            <LoaderCircle className="animate-spin" />
                            {t("jobs.kind." + busy.get(app.name))}
                          </Badge>
                        ) : isOutdated ? (
                          <Badge variant="warning">
                            <TriangleAlert />
                            {t("installed.outdated")}
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <Check />
                            {t("installed.upToDate")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {isOutdated && (
                            <Button size="sm" disabled={isBusy} onClick={() => setUpdateAsk(app.name)}>
                              {t("common.update")}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={isBusy}
                            onClick={() => useApp.setState({ uninstallAsk: app.name })}
                          >
                            {t("common.uninstall")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrap>
        )}
      </div>

      <ConfirmDialog
        open={!!updateAsk}
        title={t("installed.updateTitle")}
        message={t("installed.updateDesc", { name: updateAsk })}
        confirmText={t("common.update")}
        onConfirm={confirmUpdate}
        onCancel={() => setUpdateAsk("")}
      />

      <ConfirmDialog
        open={!!uninstallAsk}
        title={t("installed.uninstallTitle")}
        message={t("installed.uninstallDesc", { name: uninstallAsk })}
        destructive
        confirmText={t("common.uninstall")}
        onConfirm={confirmUninstall}
        onCancel={() => useApp.setState({ uninstallAsk: "" })}
      />

      <ConfirmDialog
        open={updateAllOpen}
        title={t("installed.updateAllTitle")}
        message={t("installed.updateAllDesc", { n: outdatedList.length })}
        items={outdatedList}
        confirmText={t("installed.updateAll")}
        onConfirm={confirmUpdateAll}
        onCancel={() => setUpdateAllOpen(false)}
      />
    </div>
  );
}
