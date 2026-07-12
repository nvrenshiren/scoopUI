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
  if (job.state === "running") return <LoaderCircle className="size-3.5 shrink-0 animate-spin text-primary" />;
  if (job.state === "succeeded") return <Check className="size-3.5 shrink-0 text-primary" />;
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
      className="surface-glass fixed right-6 bottom-14 z-40 flex max-h-[min(560px,calc(100vh-120px))] w-[480px] flex-col overflow-hidden rounded-xl border border-border shadow-[var(--shadow-xl)]"
    >
      {anyRunning && <div className="running-bar" />}

      <div className="flex items-center gap-2 py-3 pr-3 pl-4">
        <List className="size-[15px]" />
        <span className="font-heading text-sm font-semibold">{t("jobs.title")}</span>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="iconSm"
          aria-label={t("common.close")}
          onClick={() => useApp.setState({ jobsPanelOpen: false })}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="p-6 text-center text-[13px] text-muted-foreground">{t("jobs.empty")}</div>
      ) : (
        <>
          <div className="flex max-h-[180px] flex-col gap-0.5 overflow-auto px-2">
            {sorted.map((job) => (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(job.id)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedId(job.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px]",
                  selected?.id === job.id
                    ? "bg-[var(--primary-glow-soft)] shadow-[inset_2px_0_0_var(--primary)]"
                    : "hover:bg-secondary",
                )}
              >
                <StateGlyph job={job} />
                <span className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {jobTitle(job)}
                </span>
                <span className="flex-1" />
                <Badge variant={stateBadgeVariant(job.state)}>{t("jobs.state." + job.state)}</Badge>
                {(job.state === "queued" || job.state === "running") && (
                  <Button
                    variant="cancel"
                    className="h-6 px-2 text-xs"
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
                <Progress className="mb-2" value={null} />
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
