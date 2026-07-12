/**
 * 共享枚举入口(architect 唯一可改,TECH.md §5.1)
 * 全大写下划线错误码、PascalCase 状态枚举。
 */

export const UILanguage = {
  zhCN: 'zh-CN',
  enUS: 'en-US',
} as const;
export type UILanguage = (typeof UILanguage)[keyof typeof UILanguage];

export const InstallJobState = {
  Queued: 'queued',
  Running: 'running',
  Succeeded: 'succeeded',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const;
export type InstallJobState = (typeof InstallJobState)[keyof typeof InstallJobState];

export const ProgressStage = {
  Downloading: 'downloading',
  Extracting: 'extracting',
  Installing: 'installing',
  Uninstalling: 'uninstalling',
  Updating: 'updating',
  Cloning: 'cloning',
  Removing: 'removing',
  Message: 'message',
} as const;
export type ProgressStage = (typeof ProgressStage)[keyof typeof ProgressStage];

export const AppState = {
  Installed: 'installed',
  Outdated: 'outdated',
  Missing: 'missing',
} as const;
export type AppState = (typeof AppState)[keyof typeof AppState];

export const ScoopState = {
  NotInstalled: 'not-installed',
  Installed: 'installed',
  VersionError: 'version-error',
} as const;
export type ScoopState = (typeof ScoopState)[keyof typeof ScoopState];

export const BucketState = {
  Added: 'added',
  Known: 'known',
} as const;
export type BucketState = (typeof BucketState)[keyof typeof BucketState];

export const BootStage = {
  Detecting: 'detecting',
  Ready: 'ready',
  NeedsInstall: 'needs-install',
  Error: 'error',
} as const;
export type BootStage = (typeof BootStage)[keyof typeof BootStage];

export const ErrorCode = {
  ScoopNotFound: 'E_SCOOP_NOT_FOUND',
  ScoopVersionParseFailed: 'E_SCOOP_VERSION_PARSE_FAILED',
  ScoopSpawnFailed: 'E_SCOOP_SPAWN_FAILED',
  ScoopInstallTimeout: 'E_SCOOP_INSTALL_TIMEOUT',
  ScoopInstallFailed: 'E_SCOOP_INSTALL_FAILED',
  ScoopParseFailed: 'E_SCOOP_PARSE_FAILED',
  ScoopPermissionDenied: 'E_SCOOP_PERMISSION_DENIED',
  OnboardingInstallFailed: 'E_ONBOARDING_INSTALL_FAILED',
  OnboardingPsNotFound: 'E_ONBOARDING_PS_NOT_FOUND',
  OnboardingPostcheckFailed: 'E_ONBOARDING_POSTCHECK_FAILED',
  PreferencesInvalid: 'E_PREFERENCES_INVALID',
  PreferencesWriteFailed: 'E_PREFERENCES_WRITE_FAILED',
  IpcInvalidInput: 'E_IPC_INVALID_INPUT',
  JobNotFound: 'E_JOB_NOT_FOUND',
  JobCancelled: 'E_JOB_CANCELLED',
  BucketAddFailed: 'E_BUCKET_ADD_FAILED',
  BucketRemoveFailed: 'E_BUCKET_REMOVE_FAILED',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const IpcChannel = {
  ScoopOnboardingCheck: 'scoop:onboarding:check',
  ScoopOnboardingInstall: 'scoop:onboarding:install',
  ScoopOnboardingInstallProgress: 'scoop:onboarding:install:progress',
  ScoopAppsListInstalled: 'scoop:apps:listInstalled',
  ScoopAppsSearch: 'scoop:apps:search',
  ScoopAppsInfo: 'scoop:apps:info',
  ScoopAppsStatus: 'scoop:apps:status',
  ScoopAppsInstall: 'scoop:apps:install',
  ScoopAppsInstallProgress: 'scoop:apps:install:progress',
  ScoopAppsUninstall: 'scoop:apps:uninstall',
  ScoopAppsUninstallProgress: 'scoop:apps:uninstall:progress',
  ScoopAppsUpdate: 'scoop:apps:update',
  ScoopAppsUpdateProgress: 'scoop:apps:update:progress',
  ScoopBucketsList: 'scoop:buckets:list',
  ScoopBucketsKnown: 'scoop:buckets:known',
  ScoopBucketsAdd: 'scoop:buckets:add',
  ScoopBucketsAddProgress: 'scoop:buckets:add:progress',
  ScoopBucketsRemove: 'scoop:buckets:remove',
  ScoopBucketsRemoveProgress: 'scoop:buckets:remove:progress',
  ScoopPrefsGet: 'scoop:prefs:get',
  ScoopPrefsSet: 'scoop:prefs:set',
} as const;
export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel];
