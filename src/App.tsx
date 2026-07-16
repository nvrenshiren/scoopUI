// P03 · 主界面壳 + Boot Sequence 编排(flow §2.6)
// boot != ready 时呈现 P02(语言选择)/ P01(检测与协助安装);
// ready 后:侧边栏(240px)+ 主区 + 任务浮层(P08)+ 详情对话框(P07)
import { useMemo, type ComponentType, type ReactNode } from "react";
import { Layers, List, LoaderCircle, Package, Search, SlidersVertical, Terminal, Wrench } from "lucide-react";
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
        "flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 text-[13px] font-medium transition-colors",
        active
          ? "bg-[var(--primary-glow-soft)] text-primary shadow-[inset_2px_0_0_var(--primary)]"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
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
    <div className="flex h-full">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-card pb-3">
        <div className="gradient-line" />
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3.5">
          <div className="flex size-9 items-center justify-center rounded-md border border-[var(--primary-glow)] bg-[var(--primary-glow-soft)] text-primary">
            <Terminal className="size-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="font-heading text-[15px] font-bold">Scoop GUI</div>
            <div className="max-w-[160px] overflow-hidden font-mono text-[10px] text-ellipsis whitespace-nowrap text-subtle">
              {scoopVersion || "scoop"}
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
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

        <div className="px-3">
          <NavItem
            active={jobsPanelOpen}
            icon={List}
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
        </div>
      </aside>

      <main className="h-full min-w-0 flex-1">
        <View />
      </main>
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
