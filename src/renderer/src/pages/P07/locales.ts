import { useTranslation } from 'react-i18next';

export type Lang = 'zh' | 'en';

const LOCALES = {
  zh: {
    title: '软件包详情',
    target: '操作对象',
    description: '说明',
    bucket: '桶',
    homepage: '主页',
    license: '许可证',
    source: '来源',
    size: '下载',
    checksum: '校验',
    installPath: '安装路径',
    installedAt: '安装时间',
    currentVersion: '当前版本',
    latestVersion: '最新版本',
    conflict: '冲突项',
    upToDate: '已是最新版本',
    resolveConflict: '请解决冲突后重试',
    viewConflict: '查看冲突',
    viewManifest: '查看清单',
    suggestion: '建议操作',
    retryOrInspect: '重试或检查清单',
    badgeInstallable: '可装',
    badgeInstalled: '已装',
    badgeLatest: '最新',
    badgeOutdated: '过期',
    badgeConflicting: '冲突',
    badgeReadFailed: '读取失败',
    cancel: '取消',
    close: '关闭',
    install: '安装',
    uninstall: '卸载',
    update: '更新',
    confirmUninstall: '确认卸载',
    retry: '重试',
    installLong: '安装',
    uninstallLong: '卸载',
    updateLong: '更新',
    ariaClose: '关闭',
    noticeNewer: '有新版本可用',
    noticeReleased: '发布',
    readFailedTitle: '无法读取软件包详情',
    readFailedBody: '解析该软件包的清单文件时发生错误。请稍后重试,或返回来源页继续。',
    unavailableTitle: '当前状态下操作不可用',
    unavailableBodyConflict: (target: string) =>
      `检测到与 ${target} 冲突,需先解决冲突或选择另一版本后再进行更新。`,
    uninstallConfirmTitle: '确认卸载',
    uninstallConfirmBody: (name: string, version: string) =>
      `即将卸载 ${name} v${version}。此操作不可撤销,所有相关数据(用户配置、缓存)将被永久删除。`,
    uninstallCommandPreview: '命令预览',
    uninstallCommandLine: 'scoop uninstall',
    commandPreviewTail: '--purge',
    targetColon: '操作对象',
    outOf: '目标',
    bucketMeta: 'ScoopCore/bucket',
    versionSeparator: '·',
    fromTo: '→',
    dash: '—',
    notAvailable: '不适用',
    loading: '加载中…',
    retrying: '重试中…',
  },
  en: {
    title: 'App details',
    target: 'Target',
    description: 'Description',
    bucket: 'Bucket',
    homepage: 'Homepage',
    license: 'License',
    source: 'Source',
    size: 'Size',
    checksum: 'Checksum',
    installPath: 'Install path',
    installedAt: 'Installed',
    currentVersion: 'Current',
    latestVersion: 'Latest',
    conflict: 'Conflict',
    upToDate: 'Up-to-date',
    resolveConflict: 'Resolve conflict to continue',
    viewConflict: 'View conflict',
    viewManifest: 'View manifest',
    suggestion: 'Suggestion',
    retryOrInspect: 'Retry or inspect manifest',
    badgeInstallable: 'Installable',
    badgeInstalled: 'Installed',
    badgeLatest: 'Latest',
    badgeOutdated: 'Outdated',
    badgeConflicting: 'Conflicting',
    badgeReadFailed: 'Read failed',
    cancel: 'Cancel',
    close: 'Close',
    install: 'Install',
    uninstall: 'Uninstall',
    update: 'Update',
    confirmUninstall: 'Confirm uninstall',
    retry: 'Retry',
    installLong: 'Install',
    uninstallLong: 'Uninstall',
    updateLong: 'Update',
    ariaClose: 'Close',
    noticeNewer: 'A newer version is available',
    noticeReleased: 'released',
    readFailedTitle: 'Failed to read app details',
    readFailedBody:
      'An error occurred while parsing the manifest. Retry shortly, or go back to continue.',
    unavailableTitle: 'Action unavailable in current state',
    unavailableBodyConflict: (target: string) =>
      `A conflict with ${target} was detected. Resolve the conflict or pick another version before updating.`,
    uninstallConfirmTitle: 'Confirm uninstall',
    uninstallConfirmBody: (name: string, version: string) =>
      `You're about to uninstall ${name} v${version}. This action is irreversible. Related data (user config, cache) will be permanently deleted.`,
    uninstallCommandPreview: 'Command preview',
    uninstallCommandLine: 'scoop uninstall',
    commandPreviewTail: '--purge',
    targetColon: 'Target',
    outOf: 'Target',
    bucketMeta: 'ScoopCore/bucket',
    versionSeparator: '·',
    fromTo: '→',
    dash: '—',
    notAvailable: 'N/A',
    loading: 'Loading…',
    retrying: 'Retrying…',
  },
} as const;

export type LocaleKey = keyof typeof LOCALES['zh'];
export type PackageDialogCopy = (typeof LOCALES)[Lang];

export function detectLang(): Lang {
  if (typeof window === 'undefined') return 'zh';
  const htmlLang = document.documentElement.lang;
  if (htmlLang) return htmlLang.startsWith('en') ? 'en' : 'zh';
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN';
  return nav.startsWith('en') ? 'en' : 'zh';
}

export function usePackageDialogLang(): Lang {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('en') ? 'en' : 'zh';
}

export function pickLocale(lang: Lang): PackageDialogCopy {
  return LOCALES[lang];
}