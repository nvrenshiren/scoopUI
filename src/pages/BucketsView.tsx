// P06 · 桶管理页(F09/F10/F11/F12):双 Tab —— 已添加 / 已知桶清单
import { useMemo, useState } from "react";
import { Check, Layers, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";

import { t } from "@/i18n";
import { enqueue, refreshBuckets, selectBusyTargets, useApp, useLang } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

export function BucketsView() {
  useLang();
  const buckets = useApp((s) => s.buckets);
  const known = useApp((s) => s.knownBuckets);
  const jobs = useApp((s) => s.jobs);
  const loading = useApp((s) => s.loading.buckets);
  const error = useApp((s) => s.errors.buckets);

  const busy = useMemo(() => selectBusyTargets(jobs), [jobs]);
  const addedNames = useMemo(() => new Set(buckets.map((b) => b.name)), [buckets]);
  const knownRows = useMemo(() => known.map((name) => ({ name, added: addedNames.has(name) })), [known, addedNames]);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRepo, setAddRepo] = useState("");
  const [removeTarget, setRemoveTarget] = useState("");

  function submitAdd() {
    const name = addName.trim();
    if (!name) return;
    setAddOpen(false);
    void enqueue("bucket-add", name, addRepo.trim() || undefined);
    setAddName("");
    setAddRepo("");
  }

  function confirmRemove() {
    const name = removeTarget;
    setRemoveTarget("");
    if (name) void enqueue("bucket-remove", name);
  }

  function BusyBadge({ name }: { name: string }) {
    return (
      <Badge variant="info">
        <LoaderCircle className="animate-spin" />
        {t("jobs.kind." + busy.get(name))}
      </Badge>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="bg-grid relative px-7 pt-6 pb-4">
        <div className="bg-glow-top pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">{t("buckets.title")}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("buckets.desc")}</p>
          </div>
          <Button variant="outline" disabled={loading} onClick={() => void refreshBuckets()}>
            {loading ? (
              <LoaderCircle className="size-4 animate-spin text-primary" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("common.refresh")}
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            {t("buckets.addCustom")}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-7 pb-6">
        {error ? (
          <EmptyState error title={t("buckets.loadFailed")} hint={t("error.scoopUnavailable")}>
            <Button variant="secondary" onClick={() => void refreshBuckets()}>
              <RefreshCw className="size-4" />
              {t("common.refresh")}
            </Button>
          </EmptyState>
        ) : (
          <Tabs defaultValue="added" className="flex min-h-0 flex-1 flex-col gap-3">
            <TabsList>
              <TabsTrigger value="added">
                {t("buckets.addedTab")}
                <span className="text-muted-foreground">({buckets.length})</span>
              </TabsTrigger>
              <TabsTrigger value="known">{t("buckets.knownTab")}</TabsTrigger>
            </TabsList>

            {/* 已添加桶(F09) */}
            <TabsContent value="added" className="flex min-h-0 flex-1 flex-col">
              {buckets.length === 0 ? (
                <EmptyState icon={Layers} title={t("buckets.empty")} />
              ) : (
                <TableWrap className="min-h-0 flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t("common.name")}</TableHead>
                        <TableHead>{t("buckets.repoUrl")}</TableHead>
                        <TableHead>{t("common.updated")}</TableHead>
                        <TableHead className="text-right">{t("buckets.manifests")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buckets.map((bucket) => (
                        <TableRow key={bucket.name}>
                          <TableCell className="font-mono font-medium">
                            <span className="flex items-center gap-1.5">
                              <Layers className="size-3.5 text-primary" />
                              {bucket.name}
                            </span>
                          </TableCell>
                          <TableCell
                            className="max-w-[240px] font-mono text-xs text-muted-foreground"
                            title={bucket.source}
                          >
                            {bucket.source}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{bucket.updated}</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {bucket.manifests}
                          </TableCell>
                          <TableCell className="text-right">
                            {busy.has(bucket.name) ? (
                              <BusyBadge name={bucket.name} />
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setRemoveTarget(bucket.name)}
                              >
                                <Trash2 className="size-[13px]" />
                                {t("common.remove")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrap>
              )}
            </TabsContent>

            {/* 已知桶清单(F10/F11) */}
            <TabsContent value="known" className="flex min-h-0 flex-1 flex-col">
              {knownRows.length === 0 ? (
                <EmptyState icon={Layers} title={t("buckets.knownEmpty")} />
              ) : (
                <TableWrap className="min-h-0 flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t("common.name")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {knownRows.map((row) => (
                        <TableRow key={row.name}>
                          <TableCell className="font-mono font-medium">
                            <span className="flex items-center gap-1.5">
                              <Layers className={"size-3.5 " + (row.added ? "text-primary" : "text-subtle")} />
                              {row.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            {busy.has(row.name) ? (
                              <BusyBadge name={row.name} />
                            ) : (
                              row.added && (
                                <Badge variant="success">
                                  <Check />
                                  {t("buckets.alreadyAdded")}
                                </Badge>
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!row.added && (
                              <Button
                                size="sm"
                                disabled={busy.has(row.name)}
                                onClick={() => void enqueue("bucket-add", row.name)}
                              >
                                <Plus className="size-[13px]" />
                                {t("common.add")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrap>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 自定义桶添加 */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="w-[min(480px,calc(100vw-64px))]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("buckets.addCustom")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-6 pt-4">
            <div>
              <Label htmlFor="b-name">{t("buckets.bucketName")}</Label>
              <Input
                id="b-name"
                className="font-mono"
                placeholder="extras"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              />
            </div>
            <div>
              <Label htmlFor="b-repo">
                {t("buckets.repoUrl")} {t("common.optional")}
              </Label>
              <Input
                id="b-repo"
                className="font-mono"
                placeholder="https://github.com/user/scoop-bucket"
                value={addRepo}
                onChange={(e) => setAddRepo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              />
              <div className="mt-1 text-xs text-subtle">{t("buckets.repoHelp")}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={!addName.trim()} onClick={submitAdd}>
              {t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        title={t("buckets.removeTitle")}
        message={t("buckets.removeDesc", { name: removeTarget })}
        destructive
        confirmText={t("common.remove")}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget("")}
      />
    </div>
  );
}
