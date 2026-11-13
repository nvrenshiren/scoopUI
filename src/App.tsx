// P03 · 主界面壳 + Boot Sequence 编排(flow §2.6)
// boot != ready 时呈现 P02(语言选择)/ P01(检测与协助安装);
// ready 后:侧边栏(240px)+ 主区 + 任务浮层(P08)+ 详情对话框(P07)
import { useMemo, type ComponentType, type ReactNode } from "react";
import {
  ChevronRight,
  Layers,
  ListChecks,
  LoaderCircle,
  Package,
  Search,
  SlidersVertical,
  Terminal,
  Wrench,
} from "lucide-react";
import { Toaster } from "sonner";

import { t } from "@/i18n";
import { selectOutdatedNames, useApp, useLang } from "@/store";
import type { ViewId } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DetailDialog } from "@/components/DetailDialog";
import { JobsPanel } from "@/components/JobsPanel";
import { LanguagePick } from "@/pages/LanguagePick";
import { BootView } from "@/pages/BootView";
import { InstalledView } from "@/pages/InstalledView";
import { BrowseView } from "@/pages/BrowseView";
import { BucketsView } from "@/pages/BucketsView";
import { ConfigView } from "@/pages/ConfigView";
import { SettingsView } from "@/pages/SettingsView";

const VIEWS: Record<ViewId, ComponentType> = {
  installed: InstalledView,
  browse: BrowseView,
  buckets: BucketsView,
  config: ConfigView,
  settings: SettingsView,
};

function NavItem({
  active,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-accent text-accent-foreground shadow-[inset_2px_0_0_var(--primary)]"
          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0 opacity-80 group-hover:opacity-100" />
      <span className="flex-1 text-left">{label}</span>
      {badge}
    </button>
  );
}

function Shell() {
  const view = useApp((s) => s.view);
  const scoopVersion = useApp((s) => s.scoopVersion);
  const statusEntries = useApp((s) => s.statusEntries);
  const jobs = useApp((s) => s.jobs);
  const jobsPanelOpen = useApp((s) => s.jobsPanelOpen);

  const outdatedCount = useMemo(() => selectOutdatedNames(statusEntries).size, [statusEntries]);
  const activeJobCount = useMemo(
    () => Object.values(jobs).filter((j) => j.state === "queued" || j.state === "running").length,
    [jobs],
  );

  const View = VIEWS[view];

  return (
    <div className="app-shell flex h-full min-w-0 text-foreground">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-border/70 bg-card/90 pb-3 backdrop-blur-xl">
        <div className="gradient-line" />
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-secondary text-primary shadow-sm">
            <Terminal className="size-[19px]" />
          </div>
          <div className="min-w-0">
            <div className="font-heading text-[15px] font-semibold tracking-[-0.02em]">scoopUI</div>
            <div className="max-w-[160px] overflow-hidden text-xs text-ellipsis whitespace-nowrap text-muted-foreground">
              {t("app.subtitle")}
            </div>
          </div>
        </div>

        <div className="px-5 pb-2 pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
          {t("nav.workspace")}
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <NavItem
            active={view === "installed"}
            icon={Package}
            label={t("nav.installed")}
            badge={outdatedCount > 0 ? <Badge variant="warning">{outdatedCount}</Badge> : null}
            onClick={() => useApp.setState({ view: "installed" })}
          />
          <NavItem
            active={view === "browse"}
            icon={Search}
            label={t("nav.browse")}
            onClick={() => useApp.setState({ view: "browse" })}
          />
          <NavItem
            active={view === "buckets"}
            icon={Layers}
            label={t("nav.buckets")}
            onClick={() => useApp.setState({ view: "buckets" })}
          />
          <NavItem
            active={view === "config"}
            icon={Wrench}
            label={t("nav.config")}
            onClick={() => useApp.setState({ view: "config" })}
          />
          <NavItem
            active={view === "settings"}
            icon={SlidersVertical}
            label={t("nav.settings")}
            onClick={() => useApp.setState({ view: "settings" })}
          />
        </nav>

        <div className="flex-1" />

        <div className="mx-3 mb-3 rounded-xl border border-border/70 bg-background/45 p-2">
          <NavItem
            active={jobsPanelOpen}
            icon={ListChecks}
            label={t("nav.jobs")}
            badge={
              activeJobCount > 0 ? (
                <Badge variant="info">
                  <LoaderCircle className="animate-spin" />
                  {activeJobCount}
                </Badge>
              ) : null
            }
            onClick={() => useApp.setState({ jobsPanelOpen: !jobsPanelOpen })}
          />
          <div className="mt-1 flex items-center gap-2 px-3 pb-1 pt-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="truncate">{scoopVersion ? `Scoop ${scoopVersion}` : "Scoop"}</span>
          </div>
        </div>
        <div className="px-5 text-xs tracking-wide text-subtle">scoopUI</div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/70 bg-card/45 px-7 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">scoopUI</span>
            <ChevronRight className="size-3.5 text-subtle" />
            <span className="font-medium text-foreground">{t(`nav.${view}`)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            {t("app.localManager")}
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1">
          <View />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  useLang();
  const bootStage = useApp((s) => s.boot);
  const theme = useApp((s) => s.theme);

  return (
    <>
      {bootStage === "language" ? <LanguagePick /> : bootStage !== "ready" ? <BootView /> : <Shell />}
      <JobsPanel />
      <DetailDialog />
      <Toaster
        position="top-right"
        theme={theme === "system" ? "system" : theme}
        toastOptions={{
          style: {
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
          },
        }}
      />
    </>
  );
}
