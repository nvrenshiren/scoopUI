// 与 src-tauri 各 DTO(serde camelCase)一一对应的类型定义

export interface InstalledApp {
  name: string;
  version: string;
  source: string;
  updated: string;
  info: string;
}

export interface StatusEntry {
  name: string;
  installedVersion: string;
  latestVersion: string;
  missingDependencies: string;
  info: string;
}

export interface SearchResult {
  name: string;
  version: string;
  source: string;
  binaries: string;
}

export interface BucketInfo {
  name: string;
  source: string;
  updated: string;
  manifests: string;
}

export type JobKind =
  | "install"
  | "uninstall"
  | "update"
  | "bucket-add"
  | "bucket-remove"
  | "install-scoop";

export type JobState = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface JobDto {
  id: number;
  kind: JobKind;
  target: string;
  state: JobState;
  exitCode: number | null;
}

export interface JobLogEvent {
  id: number;
  line: string;
}

export interface InstallConfig {
  scoopDir: string | null;
  scoopGlobalDir: string | null;
  scoopCacheDir: string | null;
  noProxy: string | null;
  proxy: string | null;
  proxyCredentialUser: string | null;
  proxyCredentialPassword: string | null;
  proxyUseDefaultCredentials: boolean;
  runAsAdmin: boolean;
}

export type Language = "zh" | "en";
export type Theme = "dark" | "light" | "system";

export interface Settings {
  language: Language | null;
  theme: Theme | null;
  installConfig: InstallConfig | null;
}

export interface DetectResult {
  available: boolean;
  version: string | null;
  shimsDir: string | null;
}

/** Boot Sequence(flow §2.6) */
export type BootStage =
  | "init"
  | "language" // P02 首次语言选择
  | "detecting" // 检测 Scoop
  | "not-found" // 未检测到 Scoop(P01 协助安装入口)
  | "installing" // 协助安装中
  | "ready"; // 进入主界面

/** scoop config 单项值:读回可能是布尔/数字/字符串/数组/对象(原样来自 config.json) */
export type ScoopConfigValue = boolean | number | string | string[] | Record<string, unknown> | null;
/** key → 当前值(仅含已显式设置过的项;未出现即视为 scoop 默认) */
export type ScoopConfigMap = Record<string, ScoopConfigValue>;

export type ViewId = "installed" | "browse" | "buckets" | "config" | "settings";
