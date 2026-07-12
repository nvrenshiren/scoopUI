/**
 * preload API 类型 + IPC 通道引用
 * 与 src/shared/ipc-contract.ts 单边共享(主进程可被本文件类型反向 import)
 */

import type {
  IPCResult,
  AppInfo,
  AppDetail,
  OutdatedApp,
  BucketInfo,
  KnownBucket,
  ProgressEvent,
  Preferences,
  ScoopInstallConfig,
  OkResult,
} from '../shared/ipc-contract';

export const IpcChannels = {
  SCOOP_ONBOARDING_CHECK: 'scoop:onboarding:check',
  SCOOP_ONBOARDING_INSTALL: 'scoop:onboarding:install',
  SCOOP_APPS_LIST_INSTALLED: 'scoop:apps:listInstalled',
  SCOOP_APPS_SEARCH: 'scoop:apps:search',
  SCOOP_APPS_INFO: 'scoop:apps:info',
  SCOOP_APPS_STATUS: 'scoop:apps:status',
  SCOOP_APPS_INSTALL: 'scoop:apps:install',
  SCOOP_APPS_UNINSTALL: 'scoop:apps:uninstall',
  SCOOP_APPS_UPDATE: 'scoop:apps:update',
  SCOOP_BUCKETS_LIST: 'scoop:buckets:list',
  SCOOP_BUCKETS_KNOWN: 'scoop:buckets:known',
  SCOOP_BUCKETS_ADD: 'scoop:buckets:add',
  SCOOP_BUCKETS_REMOVE: 'scoop:buckets:remove',
  SCOOP_PREFS_GET: 'scoop:prefs:get',
  SCOOP_PREFS_SET: 'scoop:prefs:set',
} as const;

export interface ScoopAPI {
  // ── detection / onboarding ─────────────────────────────────
  detect(): Promise<IPCResult<{ available: boolean; version?: string; path?: string }>>;
  install(cfg: ScoopInstallConfig): Promise<IPCResult<OkResult>>;

  // ── apps ───────────────────────────────────────────────────
  listInstalled(): Promise<IPCResult<AppInfo[]>>;
  listAvailable(): Promise<IPCResult<AppInfo[]>>;
  search(query: string): Promise<IPCResult<AppInfo[]>>;
  getPackage(name: string): Promise<IPCResult<AppDetail | null>>;
  installApp(input: { name: string; bucket?: string; global: boolean }): Promise<IPCResult<OkResult>>;
  uninstallApp(input: { name: string; global: boolean }): Promise<IPCResult<OkResult>>;
  updateApp(input: { name?: string; global: boolean }): Promise<IPCResult<OkResult>>;

  // ── buckets ────────────────────────────────────────────────
  listBuckets(): Promise<IPCResult<BucketInfo[]>>;
  knownBuckets(): Promise<IPCResult<KnownBucket[]>>;
  addBucket(input: { name: string; repo?: string }): Promise<IPCResult<OkResult>>;
  removeBucket(input: { name: string }): Promise<IPCResult<OkResult>>;

  // ── jobs (高阶派发) ─────────────────────────────────────────
  runJob(jobId: string): void;
  cancelJob(jobId: string): Promise<IPCResult<OkResult>>;

  // ── settings ───────────────────────────────────────────────
  getSettings(): Promise<IPCResult<Preferences>>;
  setSettings(patch: Partial<Preferences>): Promise<IPCResult<Partial<Preferences>>>;
  openExternal(url: string): Promise<IPCResult<boolean>>;

  // ── progress subscription ──────────────────────────────────
  onProgress(channel: string, handler: (event: ProgressEvent) => void): () => void;
  offProgress(channel: string, handler: unknown): void;
}

declare global {
  interface Window {
    scoop: ScoopAPI;
  }
}

export type { AppInfo, AppDetail, OutdatedApp, BucketInfo, KnownBucket, ProgressEvent };
