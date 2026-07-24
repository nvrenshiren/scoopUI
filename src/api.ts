// Tauri IPC 封装。在纯浏览器(vite dev 直接打开)环境下退化为 mock,
// 便于不启动 Rust 后端时预览 UI;真实运行时走 @tauri-apps/api。
import type {
  BucketInfo,
  DetectResult,
  InstallConfig,
  InstalledApp,
  JobDto,
  JobKind,
  ScoopConfigMap,
  SearchResult,
  Settings,
  StatusEntry,
} from "./types";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

type Handler = (event: { payload: unknown }) => void;

// ------------------------------------------------------------------ mock 层
const mockListeners = new Map<string, Set<Handler>>();

function mockEmit(event: string, payload: unknown) {
  mockListeners.get(event)?.forEach((h) => h({ payload }));
}

// 浏览器预览:URL 带 ?setup 时模拟"未检测到 Scoop",可完整演示 P01 协助安装流程
// (表单 → 确认 → 安装日志 → 成功复检 → 进入主界面)。
const forceSetup =
  typeof location !== "undefined" && new URLSearchParams(location.search).has("setup");

const mockState = {
  scoopAvailable: !forceSetup,
  nextJobId: 0,
  jobs: [] as JobDto[],
  settings: {
    language: (localStorage.getItem("mock-lang") as Settings["language"]) ?? null,
    theme: (localStorage.getItem("mock-theme") as Settings["theme"]) ?? "dark",
    installConfig: null,
  } as Settings,
  installed: [
    { name: "7zip", version: "26.00", source: "main", updated: "2026-03-07 20:43:49", info: "" },
    { name: "git", version: "2.49.0", source: "main", updated: "2026-04-01 09:12:30", info: "" },
    { name: "nodejs", version: "23.6.0", source: "main", updated: "2026-02-11 18:20:11", info: "" },
    { name: "yazi", version: "26.5.6", source: "main", updated: "2026-06-30 08:00:00", info: "" },
    { name: "ClashforWindow", version: "0.20.39", source: "apps", updated: "2024-11-17 01:10:48", info: "Install failed" },
  ] as InstalledApp[],
  status: [
    { name: "7zip", installedVersion: "26.00", latestVersion: "26.02", missingDependencies: "", info: "" },
    { name: "nodejs", installedVersion: "23.6.0", latestVersion: "24.1.0", missingDependencies: "", info: "" },
  ] as StatusEntry[],
  search: [
    { name: "7zip", version: "26.02", source: "main", binaries: "" },
    { name: "git", version: "2.49.0", source: "main", binaries: "" },
    { name: "ripgrep", version: "14.1.1", source: "main", binaries: "rg.exe" },
    { name: "fd", version: "10.2.0", source: "main", binaries: "" },
    { name: "bat", version: "0.25.0", source: "main", binaries: "" },
    { name: "vscode", version: "1.101.0", source: "extras", binaries: "" },
    { name: "obsidian", version: "1.8.4", source: "extras", binaries: "" },
    { name: "yazi", version: "26.5.6", source: "main", binaries: "" },
  ] as SearchResult[],
  buckets: [
    { name: "main", source: "https://github.com/ScoopInstaller/Main", updated: "2026/7/10 22:23:33", manifests: "1608" },
    { name: "extras", source: "https://github.com/ScoopInstaller/Extras", updated: "2026/7/10 22:23:53", manifests: "2344" },
  ] as BucketInfo[],
  known: ["main", "extras", "versions", "nirsoft", "sysinternals", "php", "nerd-fonts", "nonportable", "java", "games"],
  // scoop 自身配置(F20);仅含已显式设置过的项,未出现即为默认。含各控件类型的示例值便于预览。
  scoopConfig: {
    "aria2-enabled": true,
    "aria2-warning-enabled": false,
    "aria2-split": 5,
    "default_architecture": "64bit",
    "scoop_branch": "master",
    "shim": "kiennq",
    "proxy": "currentuser@default",
    "use_lessmsi": true,
  } as Record<string, unknown>,
};

function mockRunJob(kind: JobKind, target: string) {
  const id = ++mockState.nextJobId;
  const job: JobDto = { id, kind, target, state: "queued", exitCode: null };
  mockState.jobs.push(job);
  const push = (line: string) => mockEmit("job-log", { id, line });
  const change = () => mockEmit("job-changed", { ...job });
  change();
  const scoopSetup = kind === "install-scoop";
  setTimeout(() => {
    job.state = "running";
    change();
    if (scoopSetup) {
      push("[scoop-gui] [1/2] Downloading Scoop installer (https://get.scoop.sh)...");
    } else {
      push(`$ scoop ${kind} ${target}`);
      push("Downloading ...");
    }
  }, 400);
  setTimeout(
    () => push(scoopSetup ? "[scoop-gui] [2/2] Running Scoop installer..." : "Extracting ... done."),
    1200,
  );
  if (scoopSetup) {
    setTimeout(() => push("Initializing..."), 1700);
    setTimeout(() => push("Downloading main bucket..."), 2000);
    setTimeout(() => push("Creating shim..."), 2200);
  }
  setTimeout(() => {
    push(scoopSetup ? "Scoop was installed successfully!" : "Linking shims ... done.");
    job.state = "succeeded";
    job.exitCode = 0;
    if (scoopSetup) mockState.scoopAvailable = true; // 安装成功 → 复检通过
    if (kind === "install") {
      mockState.installed.push({ name: target, version: "1.0.0", source: "main", updated: "just now", info: "" });
    }
    if (kind === "uninstall") {
      mockState.installed = mockState.installed.filter((a) => a.name !== target);
    }
    if (kind === "update") {
      mockState.status = mockState.status.filter((s) => s.name !== target);
    }
    if (kind === "bucket-add") {
      mockState.buckets.push({ name: target, source: "(mock)", updated: "just now", manifests: "123" });
    }
    if (kind === "bucket-remove") {
      mockState.buckets = mockState.buckets.filter((b) => b.name !== target);
    }
    change();
  }, 2400);
  return id;
}

async function mockInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  await new Promise((r) => setTimeout(r, 120));
  switch (cmd) {
    case "get_settings":
      return structuredClone(mockState.settings) as T;
    case "set_language":
      mockState.settings.language = args?.language as Settings["language"];
      localStorage.setItem("mock-lang", String(args?.language));
      return undefined as T;
    case "set_theme":
      mockState.settings.theme = args?.theme as Settings["theme"];
      localStorage.setItem("mock-theme", String(args?.theme));
      return undefined as T;
    case "detect_scoop":
      return {
        available: mockState.scoopAvailable,
        version: mockState.scoopAvailable ? "v0.5.3 (mock)" : null,
        shimsDir: null,
      } as T;
    case "scoop_list": {
      const q = ((args?.query as string) ?? "").toLowerCase();
      const rows = q
        ? mockState.installed.filter((a) => a.name.toLowerCase().includes(q))
        : mockState.installed;
      return structuredClone(rows) as T;
    }
    case "scoop_status":
      return structuredClone(mockState.status) as T;
    case "scoop_update_repo":
      return undefined as T;
    case "scoop_search": {
      const q = ((args?.query as string) ?? "").toLowerCase();
      await new Promise((r) => setTimeout(r, 500));
      return mockState.search.filter((s) => !q || s.name.toLowerCase().includes(q)) as T;
    }
    case "scoop_info":
      return [
        ["Name", String(args?.name)],
        ["Description", "A mock package description for browser preview."],
        ["Version", "1.2.3"],
        // 复现 scoop info 返回 manifest 完整路径的场景(展示层应规范化为桶名)
        ["Source", `D:\\Scoop\\user\\buckets\\main\\bucket\\${String(args?.name)}.json`],
        ["Website", "https://example.com"],
        ["License", "MIT"],
      ] as T;
    case "bucket_list":
      return structuredClone(mockState.buckets) as T;
    case "bucket_known":
      return structuredClone(mockState.known) as T;
    case "scoop_config_get":
      return structuredClone(mockState.scoopConfig) as T;
    case "scoop_config_set": {
      const raw = String(args?.value ?? "");
      let v: unknown = raw;
      if (raw === "true") v = true;
      else if (raw === "false") v = false;
      else if (raw !== "" && /^-?\d+(\.\d+)?$/.test(raw)) v = Number(raw);
      mockState.scoopConfig[String(args?.name)] = v;
      return undefined as T;
    }
    case "scoop_config_rm":
      delete mockState.scoopConfig[String(args?.name)];
      return undefined as T;
    case "enqueue_job":
      return mockRunJob(args?.kind as JobKind, args?.target as string) as T;
    case "install_scoop":
      return mockRunJob("install-scoop", "Scoop") as T;
    case "cancel_job": {
      const job = mockState.jobs.find((j) => j.id === args?.id);
      if (job && (job.state === "queued" || job.state === "running")) {
        job.state = "cancelled";
        mockEmit("job-changed", { ...job });
      }
      return undefined as T;
    }
    case "list_jobs":
      return structuredClone(mockState.jobs) as T;
    case "job_log":
      return [] as T;
    default:
      throw new Error(`mock: unknown command ${cmd}`);
  }
}

// ------------------------------------------------------------------ 公共 API
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<T>(cmd, args);
  }
  return mockInvoke<T>(cmd, args);
}

export async function listen<T>(event: string, handler: (payload: T) => void): Promise<() => void> {
  if (isTauri) {
    const { listen } = await import("@tauri-apps/api/event");
    return listen<T>(event, (e) => handler(e.payload));
  }
  const wrapped: Handler = (e) => handler(e.payload as T);
  if (!mockListeners.has(event)) mockListeners.set(event, new Set());
  mockListeners.get(event)!.add(wrapped);
  return () => mockListeners.get(event)?.delete(wrapped);
}

// 便捷类型化封装
export const api = {
  getSettings: () => invoke<Settings>("get_settings"),
  setLanguage: (language: string) => invoke<void>("set_language", { language }),
  setTheme: (theme: string) => invoke<void>("set_theme", { theme }),
  detectScoop: () => invoke<DetectResult>("detect_scoop"),
  list: (query?: string) => invoke<InstalledApp[]>("scoop_list", { query: query || null }),
  status: () => invoke<StatusEntry[]>("scoop_status"),
  updateRepo: () => invoke<void>("scoop_update_repo"),
  search: (query?: string) => invoke<SearchResult[]>("scoop_search", { query: query || null }),
  info: (name: string) => invoke<[string, string][]>("scoop_info", { name }),
  bucketList: () => invoke<BucketInfo[]>("bucket_list"),
  bucketKnown: () => invoke<string[]>("bucket_known"),
  enqueueJob: (kind: JobKind, target: string, repo?: string) =>
    invoke<number>("enqueue_job", { kind, target, repo: repo || null }),
  installScoop: (config: InstallConfig) => invoke<number>("install_scoop", { config }),
  cancelJob: (id: number) => invoke<void>("cancel_job", { id }),
  listJobs: () => invoke<JobDto[]>("list_jobs"),
  jobLog: (id: number) => invoke<string[]>("job_log", { id }),
  configGet: () => invoke<ScoopConfigMap>("scoop_config_get"),
  configSet: (name: string, value: string) => invoke<void>("scoop_config_set", { name, value }),
  configRemove: (name: string) => invoke<void>("scoop_config_rm", { name }),
};
