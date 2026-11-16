import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CircleArrowUp,
  Clock3,
  Layers,
  ListChecks,
  LoaderCircle,
  Package,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { t } from "@/i18n";
import { enqueue, selectOutdatedNames, useApp, useLang } from "@/store";
import type { JobDto } from "@/types";
import { bucketNameOf } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <section className="rounded-xl border border-border/80 bg-card/90 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={
            tone === "warning"
              ? "flex size-8 items-center justify-center rounded-lg bg-[var(--warning-soft)] text-warning"
              : "flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
          }
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold leading-7 tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </section>
  );
}

function JobState({ job }: { job: JobDto }) {
  const variant =
    job.state === "failed" ? "destructive" : job.state === "succeeded" ? "success" : job.state === "running" ? "info" : "default";
  return <Badge variant={variant}>{t(`jobs.state.${job.state}`)}</Badge>;
}

export function OverviewView() {
  useLang();
  const installed = useApp((s) => s.installed);
  const statusEntries = useApp((s) => s.statusEntries);
  const available = useApp((s) => s.available);
  const availableLoaded = useApp((s) => s.availableLoaded);
  const buckets = useApp((s) => s.buckets);
  const loading = useApp((s) => s.loading);
  const jobs = useApp((s) => s.jobs);
  const [updateAsk, setUpdateAsk] = useState("");

  const outdated = useMemo(() => selectOutdatedNames(statusEntries), [statusEntries]);
  const outdatedRows = useMemo(
    () => installed.filter((app) => outdated.has(app.name)).slice(0, 4),
    [installed, outdated],
  );
  const statusByName = useMemo(() => new Map(statusEntries.map((entry) => [entry.name, entry])), [statusEntries]);
  const recentJobs = useMemo(
    () => Object.values(jobs).sort((a, b) => b.id - a.id).slice(0, 4),
    [jobs],
  );

  function openPackages(tab: "installed" | "catalog") {
    useApp.setState({ view: "packages", packageTab: tab });
  }

  function confirmUpdate() {
    const name = updateAsk;
    setUpdateAsk("");
    if (name) void enqueue("update", name);
  }

  return (
    <div className="h-full min-w-0 overflow-auto">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-8 py-7">
        <section className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-success/20 bg-[var(--success-soft)] px-3 py-1 text-xs font-medium text-success">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t("app.localManager")}
            </div>
            <h1 className="mb-2 text-[28px] font-semibold tracking-[-0.04em]">{t("overview.title")}</h1>
            <p className="mb-0 max-w-2xl text-sm leading-6 text-muted-foreground">{t("overview.desc")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openPackages("catalog")}>
              <Search className="size-4" aria-hidden="true" />
              {t("overview.browseAction")}
            </Button>
            <Button variant="outline" onClick={() => openPackages("installed")}>
              <Package className="size-4" aria-hidden="true" />
              {t("overview.libraryAction")}
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label={t("overview.summary") }>
          <Metric icon={Package} label={t("overview.metric.installed")} value={loading.installed ? "—" : installed.length} detail={loading.installed ? t("common.loading") : t("overview.metric.installedHint")} />
          <Metric icon={CircleArrowUp} label={t("overview.metric.updates")} value={loading.status ? "—" : outdated.size} detail={loading.status ? t("common.loading") : t("overview.metric.updatesHint")} tone="warning" />
          <Metric icon={Layers} label={t("overview.metric.sources")} value={loading.buckets ? "—" : buckets.length} detail={loading.buckets ? t("common.loading") : t("overview.metric.sourcesHint")} />
          <Metric
            icon={ArrowDownToLine}
            label={t("overview.metric.catalog")}
            value={availableLoaded ? available.length : "—"}
            detail={availableLoaded ? t("overview.metric.catalogHint") : t("overview.metric.catalogPending")}
          />
        </section>

        <div className="grid min-h-[280px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
          <section className="flex min-h-[280px] flex-col rounded-xl border border-border/80 bg-card/90 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--warning-soft)] text-warning">
                <CircleArrowUp className="size-[17px]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="mb-0 text-sm font-semibold">{t("overview.updatesTitle")}</h2>
                <p className="mb-0 mt-0.5 text-xs text-muted-foreground">{t("overview.updatesDesc")}</p>
              </div>
              <Badge variant={loading.status ? "default" : outdated.size > 0 ? "warning" : "success"}>{loading.status ? "…" : outdated.size}</Badge>
              {!loading.status && outdated.size > 0 && (
                <Button variant="outline" size="sm" onClick={() => openPackages("installed")}>
                  {t("overview.reviewUpdates")}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
            {loading.status || loading.installed ? (
              <div className="flex flex-1 items-center justify-center gap-2 px-5 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
                {t("common.loading")}
              </div>
            ) : outdatedRows.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-5 py-6">
                <EmptyState icon={ShieldCheck} title={t("overview.noUpdates")} hint={t("overview.noUpdatesHint")} />
              </div>
            ) : (
              <div className="divide-y divide-border/60 px-2">
                {outdatedRows.map((app) => {
                  const latest = statusByName.get(app.name)?.latestVersion ?? "—";
                  return (
                    <div key={app.name} className="flex min-w-0 items-center gap-3 px-3 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background font-mono text-xs font-semibold uppercase">
                        {app.name.slice(0, 2)}
                      </span>
                      <button
                        type="button"
                        className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left"
                        onClick={() => useApp.setState({ detailName: app.name })}
                      >
                        <span className="block truncate font-mono text-sm font-medium">{app.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {bucketNameOf(app.source)} · {app.version} <ArrowRight className="mx-1 inline size-3" aria-hidden="true" /> {latest}
                        </span>
                      </button>
                      <Button variant="outline" size="sm" onClick={() => setUpdateAsk(app.name)}>
                        {t("common.update")}
                      </Button>
                    </div>
                  );
                })}
                {outdated.size > outdatedRows.length && (
                  <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                    {t("overview.moreUpdates", { n: outdated.size - outdatedRows.length })}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="flex min-h-[280px] flex-col rounded-xl border border-border/80 bg-card/90 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Clock3 className="size-[17px]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="mb-0 text-sm font-semibold">{t("overview.activityTitle")}</h2>
                <p className="mb-0 mt-0.5 text-xs text-muted-foreground">{t("overview.activityDesc")}</p>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                aria-label={t("overview.openJobs")}
                onClick={() => useApp.setState({ jobsPanelOpen: true })}
              >
                <ListChecks className="size-4" />
              </Button>
            </div>
            {recentJobs.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
                <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <ListChecks className="size-5" aria-hidden="true" />
                </span>
                <p className="mb-1 text-sm font-medium">{t("overview.activityEmpty")}</p>
                <p className="mb-0 max-w-xs text-xs leading-5 text-muted-foreground">{t("overview.activityEmptyHint")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 px-2">
                {recentJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => useApp.setState({ jobsPanelOpen: true })}
                    className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <ListChecks className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{job.target}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t(`jobs.kind.${job.kind}`)}</span>
                    </span>
                    <JobState job={job} />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-auto border-t border-border/60 px-5 py-3">
              <button
                type="button"
                onClick={() => useApp.setState({ jobsPanelOpen: true })}
                className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-xs font-medium text-primary hover:text-link-hover"
              >
                {t("overview.openJobs")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/45 px-4 py-3 text-xs text-muted-foreground">
          <Layers className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="mb-0 leading-5">{t("overview.localDataNote")}</p>
        </div>
      </div>

      <ConfirmDialog
        open={!!updateAsk}
        title={t("installed.updateTitle")}
        message={t("installed.updateDesc", { name: updateAsk })}
        confirmText={t("common.update")}
        onConfirm={confirmUpdate}
        onCancel={() => setUpdateAsk("")}
      />
    </div>
  );
}
