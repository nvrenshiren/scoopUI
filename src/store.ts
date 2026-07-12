// 全局状态(zustand)与业务编排:Boot Sequence(flow §2.6)、数据刷新、
// InstallJob 事件流与实体状态推导。动作以模块函数形式操作 store,
// 与 IPC 层(api.ts)解耦;toast 使用 Sonner(设计系统 §8.10)。
import { create } from "zustand";
import { toast } from "sonner";
import { api, listen } from "./api";
import { setLang, t } from "./i18n";
import type {
  BootStage,
  BucketInfo,
  InstallConfig,
  InstalledApp,
  JobDto,
  JobKind,
  JobLogEvent,
  Language,
  SearchResult,
  Settings,
  StatusEntry,
  Theme,
  ViewId,
} from "./types";

interface AppState {
  boot: BootStage;
  setupError: "" | "failed" | "cancelled" | "recheckFailed";
  installJobId: number;

  view: ViewId;
  lang: Language;
  theme: Theme;

  scoopVersion: string;
  settings: Settings | null;

  installed: InstalledApp[];
  statusEntries: StatusEntry[];
  available: SearchResult[];
  availableLoaded: boolean;
  buckets: BucketInfo[];
  knownBuckets: string[];

  loading: { installed: boolean; status: boolean; available: boolean; buckets: boolean };
  errors: { installed: string; available: string; buckets: string };

  jobs: Record<number, JobDto>;
  jobLogs: Record<number, string[]>;
  jobsPanelOpen: boolean;

  /** P07 详情对话框目标(空 = 关闭) */
  detailName: string;
  /** 待确认卸载的目标(P04 确认框;详情里点卸载也走这里) */
  uninstallAsk: string;
}

export const useApp = create<AppState>()(() => ({
  boot: "init",
  setupError: "",
  installJobId: 0,

  view: "installed",
  lang: "zh",
  theme: "dark",

  scoopVersion: "",
  settings: null,

  installed: [],
  statusEntries: [],
  available: [],
  availableLoaded: false,
  buckets: [],
  knownBuckets: [],

  loading: { installed: false, status: false, available: false, buckets: false },
  errors: { installed: "", available: "", buckets: "" },

  jobs: {},
  jobLogs: {},
  jobsPanelOpen: false,

  detailName: "",
  uninstallAsk: "",
}));

const set = useApp.setState;
const get = useApp.getState;

/** 组件订阅语言用(仅为触发 t() 重渲) */
export function useLang() {
  return useApp((s) => s.lang);
}

// ------------------------------------------------------------- 派生工具

/** 过期集合:桶内最新版本存在且不等于本机版本(F03) */
export function selectOutdatedNames(statusEntries: StatusEntry[]): Set<string> {
  const setNames = new Set<string>();
  for (const e of statusEntries) {
    if (e.latestVersion && e.latestVersion !== e.installedVersion) setNames.add(e.name);
  }
  return setNames;
}

/** target → 进行中的任务种类(实体状态机"××中"瞬态) */
export function selectBusyTargets(jobs: Record<number, JobDto>): Map<string, JobKind> {
  const map = new Map<string, JobKind>();
  for (const job of Object.values(jobs)) {
    if (job.state === "queued" || job.state === "running") map.set(job.target, job.kind);
  }
  return map;
}

export function jobTitle(job: JobDto): string {
  return `${t("jobs.kind." + job.kind)} ${job.target}`;
}

export function sortedJobsOf(jobs: Record<number, JobDto>): JobDto[] {
  return Object.values(jobs).sort((a, b) => b.id - a.id);
}

// ------------------------------------------------------------- 数据刷新

export async function refreshInstalled() {
  set((s) => ({ loading: { ...s.loading, installed: true } }));
  try {
    const installed = await api.list();
    set((s) => ({ installed, errors: { ...s.errors, installed: "" }, loading: { ...s.loading, installed: false } }));
  } catch (e) {
    set((s) => ({ errors: { ...s.errors, installed: String(e) }, loading: { ...s.loading, installed: false } }));
  }
}

export async function refreshStatus() {
  set((s) => ({ loading: { ...s.loading, status: true } }));
  try {
    const statusEntries = await api.status();
    set((s) => ({ statusEntries, loading: { ...s.loading, status: false } }));
  } catch (e) {
    // 过期比对失败不阻塞列表本身(F19:受影响区段提示)
    toast.error(`${t("installed.statusFailed")}: ${e}`);
    set((s) => ({ loading: { ...s.loading, status: false } }));
  }
}

/**
 * 单包状态刷新(install/uninstall/update 成功后):只跑 `scoop list <name>`,
 * 不触发全局 list/status(用户明确要求)。scoop 过滤为子串匹配,这里精确比对。
 */
async function refreshApp(name: string) {
  try {
    const rows = await api.list(name);
    const lower = name.toLowerCase();
    const matched = rows.find((r) => r.name.toLowerCase() === lower);
    set((s) => {
      const idx = s.installed.findIndex((a) => a.name.toLowerCase() === lower);
      const installed = [...s.installed];
      if (matched) {
        if (idx >= 0) installed[idx] = matched;
        else installed.push(matched);
      } else if (idx >= 0) {
        installed.splice(idx, 1);
      }
      return { installed };
    });
  } catch {
    // 单包刷新失败不打断主流程;下一次手动刷新会纠正
  }
}

/** 从过期清单移除某包(更新成功过期标记消失 / 卸载后不再跟踪) */
function dropStatusEntry(name: string) {
  const lower = name.toLowerCase();
  set((s) => ({ statusEntries: s.statusEntries.filter((e) => e.name.toLowerCase() !== lower) }));
}

export async function refreshAvailable(force = false) {
  if (get().availableLoaded && !force) return;
  set((s) => ({ loading: { ...s.loading, available: true } }));
  try {
    const available = await api.search();
    set((s) => ({
      available,
      availableLoaded: true,
      errors: { ...s.errors, available: "" },
      loading: { ...s.loading, available: false },
    }));
  } catch (e) {
    set((s) => ({ errors: { ...s.errors, available: String(e) }, loading: { ...s.loading, available: false } }));
  }
}

export async function refreshBuckets() {
  set((s) => ({ loading: { ...s.loading, buckets: true } }));
  try {
    const [buckets, knownBuckets] = await Promise.all([api.bucketList(), api.bucketKnown()]);
    set((s) => ({ buckets, knownBuckets, errors: { ...s.errors, buckets: "" }, loading: { ...s.loading, buckets: false } }));
  } catch (e) {
    set((s) => ({ errors: { ...s.errors, buckets: String(e) }, loading: { ...s.loading, buckets: false } }));
  }
}

async function initialLoad() {
  await Promise.all([refreshInstalled(), refreshStatus(), refreshBuckets()]);
}

// ------------------------------------------------------------- Boot Sequence

export async function boot() {
  set({ boot: "init" });
  await bindJobEvents();
  const settings = await api.getSettings().catch(() => null);
  set({ settings });
  applyTheme((settings?.theme as Theme) ?? "dark");

  const lang = settings?.language;
  if (lang === "zh" || lang === "en") {
    setLang(lang);
    set({ lang });
    await detectAndEnter();
  } else {
    // 首次启动:未持久化语言 → P02(flow 2.5.3-1/2)
    set({ boot: "language" });
  }
}

/** P02 首次选择语言 → 持久化 → 进入检测(flow §1.1 步骤 3-4) */
export async function chooseLanguage(lang: Language) {
  setLang(lang);
  set({ lang });
  try {
    await api.setLanguage(lang);
  } catch {
    toast.info(t("settings.persistFailed"));
  }
  await detectAndEnter();
}

async function detectAndEnter() {
  set({ boot: "detecting" });
  try {
    const result = await api.detectScoop();
    if (result.available) {
      set({ scoopVersion: result.version ?? "", boot: "ready" });
      void initialLoad();
    } else {
      set({ boot: "not-found" });
    }
  } catch {
    set({ boot: "not-found" });
  }
}

/** F16:确认配置并开始协助安装 */
export async function startInstallScoop(cfg: InstallConfig) {
  set({ setupError: "" });
  try {
    const installJobId = await api.installScoop(cfg);
    set({ installJobId, boot: "installing" });
  } catch (e) {
    toast.error(t("error.jobStartFailed", { msg: String(e) }));
  }
}

export function cancelInstallScoop() {
  const id = get().installJobId;
  if (id) void api.cancelJob(id);
}

/** 协助安装任务终态处理:成功后复检(flow 2.6.3-6/7) */
async function onInstallScoopFinished(job: JobDto) {
  if (job.state === "succeeded") {
    const result = await api.detectScoop().catch(() => null);
    if (result?.available) {
      set({ scoopVersion: result.version ?? "", setupError: "", boot: "ready" });
      void initialLoad();
      return;
    }
    set({ setupError: "recheckFailed", boot: "not-found" });
  } else if (job.state === "cancelled") {
    set({ setupError: "cancelled", boot: "not-found" });
  } else {
    set({ setupError: "failed", boot: "not-found" });
  }
}

// ------------------------------------------------------------- 任务事件

let eventsBound = false;
async function bindJobEvents() {
  if (eventsBound) return;
  eventsBound = true;

  await listen<JobDto>("job-changed", (job) => {
    const prev = get().jobs[job.id]?.state;
    set((s) => ({
      jobs: { ...s.jobs, [job.id]: job },
      jobLogs: s.jobLogs[job.id] ? s.jobLogs : { ...s.jobLogs, [job.id]: [] },
    }));

    const finished =
      (prev === "queued" || prev === "running" || prev === undefined) &&
      (job.state === "succeeded" || job.state === "failed" || job.state === "cancelled");
    if (!finished) return;

    if (job.kind === "install-scoop") {
      void onInstallScoopFinished(job);
      return;
    }

    const title = jobTitle(job);
    if (job.state === "succeeded") {
      toast.success(t("jobs.succeededToast", { title }));
      // 成功后仅刷新被操作实体自身的状态,不做全局检查更新(用户要求)
      if (job.kind === "install") {
        void refreshApp(job.target);
      } else if (job.kind === "update") {
        void refreshApp(job.target);
        dropStatusEntry(job.target); // 过期标记消失(flow 2.1.3-13)
      } else if (job.kind === "uninstall") {
        void refreshApp(job.target);
        dropStatusEntry(job.target);
      }
      if (job.kind === "bucket-add" || job.kind === "bucket-remove") {
        void refreshBuckets();
        if (get().availableLoaded) void refreshAvailable(true);
      }
    } else if (job.state === "failed") {
      toast.error(t("jobs.failedToast", { title }), { duration: 6000 });
      set({ jobsPanelOpen: true });
    } else {
      toast.info(t("jobs.cancelledToast", { title }));
    }
  });

  await listen<JobLogEvent>("job-log", ({ id, line }) => {
    set((s) => {
      let lines = [...(s.jobLogs[id] ?? []), line];
      if (lines.length > 2000) lines = lines.slice(500);
      return { jobLogs: { ...s.jobLogs, [id]: lines } };
    });
  });
}

// ------------------------------------------------------------- 写操作入口

export async function enqueue(kind: JobKind, target: string, repo?: string) {
  try {
    await api.enqueueJob(kind, target, repo);
    set({ jobsPanelOpen: true });
  } catch (e) {
    toast.error(t("error.jobStartFailed", { msg: String(e) }));
  }
}

export async function cancelJob(id: number) {
  try {
    await api.cancelJob(id);
  } catch (e) {
    toast.error(String(e));
  }
}

// ------------------------------------------------------------- 语言 / 主题

export async function switchLanguage(lang: Language) {
  if (lang === get().lang) return;
  setLang(lang);
  set({ lang });
  try {
    await api.setLanguage(lang);
  } catch {
    // flow §1.8:切换即时生效;持久化失败仅告知
    toast.info(t("settings.persistFailed"));
  }
}

let mediaBound = false;
export function applyTheme(theme: Theme) {
  set({ theme });
  const root = document.documentElement;
  const dark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("light", !dark);
  if (!mediaBound) {
    mediaBound = true;
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (get().theme === "system") applyTheme("system");
    });
  }
}

export async function switchTheme(theme: Theme) {
  applyTheme(theme);
  try {
    await api.setTheme(theme);
  } catch {
    toast.info(t("settings.persistFailed"));
  }
}
