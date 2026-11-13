// P08 · 长时操作进度浮层:非 modal、可关闭,主界面可继续操作(F17)。
// 面板打开时点击其外部:优先关闭面板并吞掉该次点击(pointerdown+click 双 capture),
// 不与底层 UI 交互;更高层的 modal 对话框 / toast 例外。
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, List, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { t } from "@/i18n";
import { cancelJob, jobTitle, sortedJobsOf, useApp, useLang } from "@/store";
import type { JobDto, JobState } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

function stateBadgeVariant(state: JobState): "success" | "destructive" | "info" | "default" {
  switch (state) {
    case "succeeded":
      return "success";
    case "failed":
      return "destructive";
    case "running":
      return "info";
    default:
      return "default";
  }
}

function StateGlyph({ job }: { job: JobDto }) {
  if (job.state === "running") return <LoaderCircle className="size-3.5 shrink-0 animate-spin text-info" />;
  if (job.state === "succeeded") return <Check className="size-3.5 shrink-0 text-success" />;
  if (job.state === "failed") return <TriangleAlert className="size-3.5 shrink-0 text-destructive" />;
  if (job.state === "cancelled") return <X className="size-3.5 shrink-0 text-subtle" />;
  return <List className="size-3.5 shrink-0 text-subtle" />;
}

export function JobsPanel() {
  useLang();
  const open = useApp((s) => s.jobsPanelOpen);
  const jobs = useApp((s) => s.jobs);
  const jobLogs = useApp((s) => s.jobLogs);

  const sorted = useMemo(() => sortedJobsOf(jobs), [jobs]);
  const anyRunning = sorted.some((j) => j.state === "running");

  const [selectedId, setSelectedId] = useState(0);
  const selected: JobDto | undefined =
    (selectedId && jobs[selectedId]) || sorted.find((j) => j.state === "running") || sorted[0];
  const selectedLog = selected ? (jobLogs[selected.id] ?? []) : [];

  const panelRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [selectedLog.length, selected?.id]);

  function closePanel(restoreFocus = false) {
    useApp.setState({ jobsPanelOpen: false });
    if (restoreFocus) {
      requestAnimationFrame(() => document.getElementById("jobs-toggle")?.focus());
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      closePanel(true);
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  // 点外优先关闭 + 拦截穿透
  useEffect(() => {
    let suppressNextClick = false;
    let timer = 0;

    function onPointerDown(e: PointerEvent) {
      if (!useApp.getState().jobsPanelOpen || !panelRef.current) return;
      const target = e.target as Element | null;
      if (!target) return;
      if (panelRef.current.contains(target)) return;
      if (target.closest("[data-radix-portal],[role='dialog'],[data-sonner-toaster]")) return;
      useApp.setState({ jobsPanelOpen: false });
      e.stopPropagation();
      e.preventDefault();
      suppressNextClick = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (suppressNextClick = false), 500);
    }

    function onClick(e: MouseEvent) {
      if (!suppressNextClick) return;
      suppressNextClick = false;
      window.clearTimeout(timer);
      e.stopPropagation();
      e.preventDefault();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(timer);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="region"
      aria-labelledby="jobs-panel-title"
      className="fixed right-5 bottom-5 z-40 flex max-h-[min(600px,calc(100vh-40px))] w-[min(480px,calc(100vw-32px))] flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xl"
    >
      {anyRunning && <div className="running-bar" />}

      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3.5">
        <List className="size-[15px]" />
        <h2 id="jobs-panel-title" className="mb-0 font-heading text-sm font-semibold tracking-[-0.01em]">{t("jobs.title")}</h2>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="iconSm"
          aria-label={t("common.close")}
          onClick={() => closePanel(true)}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">{t("jobs.empty")}</div>
      ) : (
        <>
          <div className="flex max-h-[180px] flex-col gap-0.5 overflow-auto px-2">
            {sorted.map((job) => (
              <div
                key={job.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1 py-1",
                  selected?.id === job.id
                    ? "bg-accent shadow-[inset_2px_0_0_var(--primary)]"
                    : "",
                )}
              >
                <button
                  type="button"
                  aria-current={selected?.id === job.id ? "true" : undefined}
                  onClick={() => setSelectedId(job.id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm outline-none hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <StateGlyph job={job} />
                  <span className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {jobTitle(job)}
                  </span>
                  <span className="flex-1" />
                  <Badge variant={stateBadgeVariant(job.state)}>{t("jobs.state." + job.state)}</Badge>
                </button>
                {(job.state === "queued" || job.state === "running") && (
                  <Button
                    variant="cancel"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      void cancelJob(job.id);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {selected && (
            <div className="border-t border-border px-4 pt-2 pb-3.5">
              <div className="mb-1.5 text-xs text-subtle">
                {t("jobs.log")} · <span className="font-mono">{jobTitle(selected)}</span>
              </div>
              {(selected.state === "running" || selected.state === "queued") && (
                <Progress className="mb-2" value={null} aria-label={t("jobs.state.running")} />
              )}
              <div ref={logRef} className="log-box h-[180px]">
                {selectedLog.length ? selectedLog.join("\n") : <span className="text-subtle">…</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
