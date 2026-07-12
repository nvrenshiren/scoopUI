/**
 * i18n 文案 key 类型约束(渲染端 i18next namespace key 编译期检查)
 * 文案主体在 src/renderer/src/lib/i18n.ts 的资源对象里
 */
export type I18nNamespace =
  | 'common'
  | 'onboarding'
  | 'apps'
  | 'buckets'
  | 'settings'
  | 'progress'
  | 'errors';

export interface I18nKeyMap {
  common: CommonKeys;
  onboarding: OnboardingKeys;
  apps: AppsKeys;
  buckets: BucketsKeys;
  settings: SettingsKeys;
  progress: ProgressKeys;
  errors: ErrorsKeys;
}

export type CommonKeys =
  | 'common.appName'
  | 'common.cancel'
  | 'common.confirm'
  | 'common.close'
  | 'common.retry'
  | 'common.refresh'
  | 'common.search'
  | 'common.empty'
  | 'common.loading'
  | 'common.theme.light'
  | 'common.theme.dark'
  | 'common.theme.system';

export type OnboardingKeys =
  | 'onboarding.title'
  | 'onboarding.detect.checking'
  | 'onboarding.detect.found'
  | 'onboarding.detect.notFound'
  | 'onboarding.install.prompt'
  | 'onboarding.install.submit'
  | 'onboarding.install.success'
  | 'onboarding.install.failure';

export type AppsKeys =
  | 'apps.list.title'
  | 'apps.list.search'
  | 'apps.list.empty'
  | 'apps.action.install'
  | 'apps.action.uninstall'
  | 'apps.action.update'
  | 'apps.action.info'
  | 'apps.status.outdated'
  | 'apps.status.upToDate';

export type BucketsKeys =
  | 'buckets.title'
  | 'buckets.add'
  | 'buckets.remove'
  | 'buckets.empty';

export type SettingsKeys =
  | 'settings.title'
  | 'settings.language.label'
  | 'settings.theme.label'
  | 'settings.about';

export type ProgressKeys =
  | 'progress.title'
  | 'progress.downloading'
  | 'progress.installing'
  | 'progress.completed'
  | 'progress.failed'
  | 'progress.cancelled';

export type ErrorsKeys =
  | 'errors.title'
  | 'errors.unknown'
  | 'errors.permissionDenied'
  | 'errors.timeout'
  | 'errors.notFound'
  | 'errors.parseFailed';
