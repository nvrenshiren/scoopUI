import { useMemo, type ComponentType, type ReactNode } from "react";
import { Database, Home, Layers, ListChecks, LoaderCircle, Package, Settings2, Wrench } from "lucide-react";
import { Toaster } from "sonner";

import { t } from "@/i18n";
import { selectOutdatedNames, useApp, useLang } from "@/store";
import type { ViewId } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CohesionWordmark } from "@/components/CohesionWordmark";
import { DetailDialog } from "@/components/DetailDialog";
import { JobsPanel } from "@/components/JobsPanel";
import { LanguagePick } from "@/pages/LanguagePick";
import { BootView } from "@/pages/BootView";
import { OverviewView } from "@/pages/OverviewView";
import { PackagesView } from "@/pages/PackagesView";
import { BucketsView } from "@/pages/BucketsView";
import { ConfigView } from "@/pages/ConfigView";
import { SettingsView } from "@/pages/SettingsView";
import { WindowTitleBar } from "@/components/WindowTitleBar";
import packageJson from "../package.json";

const VIEWS: Record<ViewId, ComponentType> = {
  overview: OverviewView,
  packages: PackagesView,
  sources: BucketsView,
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
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        active
          ? "border-primary/10 bg-accent text-accent-foreground shadow-[inset_2px_0_0_var(--primary)]"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-[17px] shrink-0" aria-hidden="true" />
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
    () => Object.values(jobs).filter((job) => job.state === "queued" || job.state === "running").length,
    [jobs],
  );
  const View = VIEWS[view];

  return (
    <div className="app-shell flex h-full min-w-0 text-foreground">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-border/80 bg-card/90">
        <div className="gradient-line" />
        <div className="flex min-h-[76px] items-center gap-3 border-b border-border/70 px-5">
          <CohesionWordmark className="h-9 w-10" />
          <div className="min-w-0">
            <div className="font-heading text-[15px] font-semibold tracking-[-0.02em]">scoopUI</div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{t("app.subtitle")}</div>
          </div>
        </div>

        <nav aria-label={t("nav.workspace")} className="flex flex-col gap-1 px-3 pt-5">
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
            {t("nav.workspace")}
          </div>
          <NavItem
            active={view === "overview"}
            icon={Home}
            label={t("nav.overview")}
            onClick={() => useApp.setState({ view: "overview" })}
          />
          <NavItem
            active={view === "packages"}
            icon={Package}
            label={t("nav.packages")}
            badge={outdatedCount > 0 ? <Badge variant="warning">{outdatedCount}</Badge> : null}
            onClick={() => useApp.setState({ view: "packages" })}
          />
          <NavItem
            active={view === "sources"}
            icon={Database}
            label={t("nav.sources")}
            onClick={() => useApp.setState({ view: "sources" })}
          />
        </nav>

        <nav aria-label={t("nav.system")} className="mt-5 flex flex-col gap-1 px-3">
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
            {t("nav.system")}
          </div>
          <NavItem
            active={view === "config"}
            icon={Wrench}
            label={t("nav.config")}
            onClick={() => useApp.setState({ view: "config" })}
          />
        </nav>

        <div className="flex-1" />

        <div className="mx-3 mb-3 rounded-xl border border-border/75 bg-background/80 p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Layers className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium">{t("app.localManager")}</div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                {scoopVersion ? `Scoop ${scoopVersion}` : "Scoop"}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/70 px-3 py-3">
          <NavItem
            active={view === "settings"}
            icon={Settings2}
            label={t("nav.settings")}
            onClick={() => useApp.setState({ view: "settings" })}
          />
          <div className="mt-3 flex items-center justify-between px-3 text-[10px] tracking-wide text-subtle">
            <span>whzhuke</span>
            <span className="font-mono tabular-nums">v{packageJson.version}</span>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-[54px] shrink-0 items-center justify-between border-b border-border/75 bg-card/80 px-7">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-success shadow-[0_0_0_3px_var(--success-soft)]" aria-hidden="true" />
            <span className="font-medium text-foreground">{t("app.localManager")}</span>
            <span className="text-subtle" aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{scoopVersion || "Scoop"}</span>
          </div>
          <button
            id="jobs-toggle"
            type="button"
            aria-pressed={jobsPanelOpen}
            onClick={() => useApp.setState({ jobsPanelOpen: !jobsPanelOpen })}
            className={cn(
              "flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              jobsPanelOpen
                ? "border-primary/20 bg-accent text-accent-foreground"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            {activeJobCount > 0 ? <LoaderCircle className="size-3.5 animate-spin text-info" /> : <ListChecks className="size-3.5" />}
            {t("nav.jobs")}
            {activeJobCount > 0 && <Badge variant="info">{activeJobCount}</Badge>}
          </button>
        </header>
        <main id="main-content" className="min-h-0 min-w-0 flex-1">
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
      <div className="flex h-full min-h-0 flex-col">
        <WindowTitleBar />
        <div className="min-h-0 flex-1">
          {bootStage === "language" ? <LanguagePick /> : bootStage !== "ready" ? <BootView /> : <Shell />}
        </div>
      </div>
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
