/**
 * IPC 通道清单 + 共享 zod schema
 * 单一出处:`docs/architecture/api/electron/scoop-gui.md` (已审批)
 * 命名遵循 TECH.md §6
 */

import { z } from 'zod';

// re-export IPC 类型供 preload/共享代码使用
export type { IPCResult, IPCError } from './ipc-result';

export const IpcChannels = {
  SCOOP_ONBOARDING_CHECK: 'scoop:onboarding:check',
  SCOOP_ONBOARDING_INSTALL: 'scoop:onboarding:install',
  SCOOP_ONBOARDING_INSTALL_PROGRESS: 'scoop:onboarding:install:progress',
  SCOOP_APPS_LIST_INSTALLED: 'scoop:apps:listInstalled',
  SCOOP_APPS_SEARCH: 'scoop:apps:search',
  SCOOP_APPS_INFO: 'scoop:apps:info',
  SCOOP_APPS_STATUS: 'scoop:apps:status',
  SCOOP_APPS_INSTALL: 'scoop:apps:install',
  SCOOP_APPS_INSTALL_PROGRESS: 'scoop:apps:install:progress',
  SCOOP_APPS_UNINSTALL: 'scoop:apps:uninstall',
  SCOOP_APPS_UNINSTALL_PROGRESS: 'scoop:apps:uninstall:progress',
  SCOOP_APPS_UPDATE: 'scoop:apps:update',
  SCOOP_APPS_UPDATE_PROGRESS: 'scoop:apps:update:progress',
  SCOOP_BUCKETS_LIST: 'scoop:buckets:list',
  SCOOP_BUCKETS_KNOWN: 'scoop:buckets:known',
  SCOOP_BUCKETS_ADD: 'scoop:buckets:add',
  SCOOP_BUCKETS_ADD_PROGRESS: 'scoop:buckets:add:progress',
  SCOOP_BUCKETS_REMOVE: 'scoop:buckets:remove',
  SCOOP_BUCKETS_REMOVE_PROGRESS: 'scoop:buckets:remove:progress',
  SCOOP_PREFS_GET: 'scoop:prefs:get',
  SCOOP_PREFS_SET: 'scoop:prefs:set',
} as const;

export type IpcChannelName = (typeof IpcChannels)[keyof typeof IpcChannels];

export const ProgressChannels = new Set<string>([
  IpcChannels.SCOOP_ONBOARDING_INSTALL_PROGRESS,
  IpcChannels.SCOOP_APPS_INSTALL_PROGRESS,
  IpcChannels.SCOOP_APPS_UNINSTALL_PROGRESS,
  IpcChannels.SCOOP_APPS_UPDATE_PROGRESS,
  IpcChannels.SCOOP_BUCKETS_ADD_PROGRESS,
  IpcChannels.SCOOP_BUCKETS_REMOVE_PROGRESS,
]);

export const InstallJobStateSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);
export type InstallJobState = z.infer<typeof InstallJobStateSchema>;

export const ProgressStageSchema = z.enum([
  'downloading',
  'extracting',
  'installing',
  'uninstalling',
  'updating',
  'cloning',
  'removing',
  'message',
]);
export type ProgressStage = z.infer<typeof ProgressStageSchema>;

export const AppInfoSchema = z.object({
  name: z.string().min(1),
  version: z.string(),
  source: z.string(),
  updated: z.string().optional(),
  info: z.string().optional(),
});
export type AppInfo = z.infer<typeof AppInfoSchema>;

export const OutdatedAppSchema = z.object({
  name: z.string().min(1),
  installed: z.string(),
  latest: z.string(),
  missing: z.string().optional(),
  info: z.string().optional(),
  isOutdated: z.boolean(),
});
export type OutdatedApp = z.infer<typeof OutdatedAppSchema>;

export const BucketInfoSchema = z.object({
  name: z.string().min(1),
  source: z.string().url(),
  updated: z.string().optional(),
  manifests: z.number().int().nonnegative().optional(),
});
export type BucketInfo = z.infer<typeof BucketInfoSchema>;

export const KnownBucketSchema = z.object({
  name: z.string().min(1),
  repo: z.string().url().optional(),
});
export type KnownBucket = z.infer<typeof KnownBucketSchema>;

export const AppDetailSchema = AppInfoSchema.extend({
  description: z.string().optional(),
  homepage: z.string().url().optional(),
});
export type AppDetail = z.infer<typeof AppDetailSchema>;

export const ScoopInstallConfigSchema = z.object({
  scoopDir: z.string().min(1),
  scoopGlobalDir: z.string().optional(),
  scoopCacheDir: z.string().optional(),
  noProxy: z.boolean(),
  proxy: z.string().optional(),
  proxyCredential: z
    .object({ username: z.string(), password: z.string() })
    .optional(),
  proxyUseDefaultCredentials: z.boolean(),
  runAsAdmin: z.boolean(),
});
export type ScoopInstallConfig = z.infer<typeof ScoopInstallConfigSchema>;

export const WindowBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type WindowBounds = z.infer<typeof WindowBoundsSchema>;

export const UILanguageSchema = z.enum(['zh-CN', 'en-US']);
export type UILanguageZ = z.infer<typeof UILanguageSchema>;

export const PreferencesSchema = z.object({
  uiLanguage: UILanguageSchema,
  onboardingCompleted: z.boolean(),
  scoopInstallConfig: ScoopInstallConfigSchema.optional(),
  windowBounds: WindowBoundsSchema.optional(),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const ProgressChunkSchema = z.object({
  raw: z.string(),
  stage: ProgressStageSchema,
  percent: z.number().min(0).max(100).optional(),
  url: z.string().url().optional(),
  bytes: z.number().int().nonnegative().optional(),
});
export type ProgressChunk = z.infer<typeof ProgressChunkSchema>;

export const ProgressErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  cause: z.unknown().optional(),
});

export const ProgressEventSchema = z.object({
  jobId: z.string().uuid(),
  channel: z.string().min(1),
  state: InstallJobStateSchema,
  chunk: ProgressChunkSchema.optional(),
  error: ProgressErrorSchema.optional(),
  ts: z.number().int().positive(),
});
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

export const OkResultSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
});
export type OkResult = z.infer<typeof OkResultSchema>;

export const CheckOutputSchema = z.object({
  available: z.boolean(),
  version: z.string().optional(),
  path: z.string().optional(),
});
export type CheckOutput = z.infer<typeof CheckOutputSchema>;

export const SearchInputSchema = z.object({ query: z.string() });
export const InfoInputSchema = z.object({ name: z.string().min(1) });
export const InstallAppInputSchema = z.object({
  name: z.string().min(1),
  bucket: z.string().optional(),
  global: z.boolean(),
});
export const UninstallAppInputSchema = z.object({
  name: z.string().min(1),
  global: z.boolean(),
});
export const UpdateAppInputSchema = z.object({
  name: z.string().min(1).optional(),
  global: z.boolean(),
});
export const BucketAddInputSchema = z.object({
  name: z.string().min(1),
  repo: z.string().url().optional(),
});
export const BucketRemoveInputSchema = z.object({ name: z.string().min(1) });
export const PrefsSetInputSchema = PreferencesSchema.partial();
export const EmptyInputSchema = z.object({}).strict();
