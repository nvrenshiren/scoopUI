// P05 · 浏览/搜索软件包页(F01 可装部分 / F02 / F04 / F05)
// 数据源:scoop search 全量输出;搜索框对全量数据做即时过滤(软件源唯一性约束)
import { useEffect, useMemo, useState } from "react";
import { Check, Download, LoaderCircle, RefreshCw, Search } from "lucide-react";

import { t } from "@/i18n";
import { enqueue, refreshAvailable, selectBusyTargets, useApp, useLang } from "@/store";
import { bucketNameOf } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";

const LIMIT = 500;

export function BrowseView() {
  useLang();
  const available = useApp((s) => s.available);
  const installed = useApp((s) => s.installed);
  const jobs = useApp((s) => s.jobs);
  const loading = useApp((s) => s.loading.available);
  const error = useApp((s) => s.errors.available);

  const [query, setQuery] = useState("");

  useEffect(() => {
    void refreshAvailable();
  }, []);

  const installedNames = useMemo(() => new Set(installed.map((a) => a.name)), [installed]);
  const busy = useMemo(() => selectBusyTargets(jobs), [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((r) => r.name.toLowerCase().includes(q));
  }, [available, query]);

  const shown = useMemo(() => filtered.slice(0, LIMIT), [filtered]);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="bg-grid relative px-7 pt-6 pb-4">
        <div className="bg-glow-top pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">{t("browse.title")}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("browse.desc")}</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => void refreshAvailable(true)}>
            {loading ? (
              <LoaderCircle className="size-4 animate-spin text-primary" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-7 pb-6">
        <div className="relative">
          <Search className="absolute top-3 left-3 size-4 text-subtle" />
          <Input
            className="pl-9"
            placeholder={t("browse.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <LoaderCircle className="size-8 animate-spin text-primary" />
            <span className="text-[13px]">{t("browse.loadingAll")}</span>
          </div>
        ) : error ? (
          <EmptyState error title={t("browse.loadFailed")} hint={t("error.scoopUnavailable")}>
            <Button variant="secondary" onClick={() => void refreshAvailable(true)}>
              <RefreshCw className="size-4" />
              {t("common.refresh")}
            </Button>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState title={t("browse.empty")} hint={t("browse.emptyHint")} />
        ) : (
          <>
            <TableWrap className="min-h-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("common.version")}</TableHead>
                    <TableHead>{t("common.source")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((pkg) => {
                    const isInstalled = installedNames.has(pkg.name);
                    const isBusy = busy.has(pkg.name);
                    return (
                      <TableRow
                        key={pkg.source + "/" + pkg.name}
                        className="cursor-pointer"
                        onClick={() => useApp.setState({ detailName: pkg.name })}
                      >
                        <TableCell className="font-mono font-medium">{pkg.name}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{pkg.version}</TableCell>
                        <TableCell className="text-muted-foreground" title={pkg.source}>
                          {bucketNameOf(pkg.source)}
                        </TableCell>
                        <TableCell>
                          {isBusy ? (
                            <Badge variant="info">
                              <LoaderCircle className="animate-spin" />
                              {t("jobs.kind." + busy.get(pkg.name))}
                            </Badge>
                          ) : (
                            isInstalled && (
                              <Badge variant="success">
                                <Check />
                                {t("browse.installedBadge")}
                              </Badge>
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {!isInstalled && (
                            <Button size="sm" disabled={isBusy} onClick={() => void enqueue("install", pkg.name)}>
                              <Download className="size-[13px]" />
                              {t("common.install")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrap>
            <div className="text-xs text-subtle">
              {t("browse.showing", { shown: shown.length, total: filtered.length })}
              {filtered.length > LIMIT && <> · {t("browse.narrowHint")}</>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
