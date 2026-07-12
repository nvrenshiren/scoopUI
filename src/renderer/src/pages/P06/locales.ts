import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Locale = 'zh-CN' | 'en-US';

const dict: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'page.title': '桶管理',
    'page.subtitle.addedKnown': '本机已添加 {{added}} 个 · 已知 {{known}} 个',
    'page.subtitle.addedKnownInline': '本机共 {{count}} 个桶',
    'page.breadcrumb': '桶管理',
    'page.actions.refresh': '刷新',
    'page.source': '源',
    'page.scoopOnline': 'Scoop 在线',
    'subbar.searchPlaceholder': '搜索桶名或源…',
    'subbar.cta.addFromKnown': '从已知桶添加',
    'subbar.syncKnown': '同步已知清单',
    'subbar.help': '帮助',
    'subbar.hint': '已知 {{known}} 个桶,可选 {{addable}} 个添加',
    'tabs.added': '已添加',
    'tabs.known': '已知桶',
    'tabs.addedCount': '{{count}}',
    'table.col.name': '桶名',
    'table.col.source': '源 (GitHub)',
    'table.col.apps': '桶内应用数',
    'table.col.updated': '更新时间',
    'table.col.status': '状态',
    'table.col.actions': '操作',
    'table.status.added': '已添加',
    'table.status.notAdded': '未添加',
    'table.action.refresh': '刷新',
    'table.action.remove': '移除',
    'table.action.add': '添加',
    'table.action.addedDisabled': '已添加',
    'table.empty.added.title': '尚未添加任何桶',
    'table.empty.added.desc': '请前往「已知桶」清单选择一个 Scoop 官方维护的桶进行添加;添加后可在此管理。',
    'table.empty.added.cta': '查看已知桶',
    'error.known.title': '无法加载已知桶清单',
    'error.known.desc': '从 Scoop 官方获取已知桶列表失败。请检查网络或稍后重试。',
    'error.known.code': '错误码',
    'error.known.retry': '重试',
    'error.known.diagnose': '诊断',
    'error.row.code': 'E_BUCKET_RM_FAILED',
    'error.row.stage': '阶段',
    'error.row.stageValue': 'removing',
    'error.row.detail': 'Scoop 命令退出码 1 · 详见 P08 日志',
    'error.row.retry': '重试移除',
    'error.row.discard': '放弃',
    'dialog.add.title': '添加桶',
    'dialog.add.titleWith': '添加桶 {{name}}?',
    'dialog.add.desc': '将从 GitHub 克隆 {{source}} 到本机桶目录,并刷新可装软件包范围。',
    'dialog.add.meta.source': '源',
    'dialog.add.meta.apps': '桶内应用数',
    'dialog.add.notice': '需要联网 · 预计耗时数秒到数十秒,可在 P08 中观察进度。',
    'dialog.add.confirm': '确认添加',
    'dialog.remove.title': '移除桶',
    'dialog.remove.titleWith': '移除桶 {{name}}?',
    'dialog.remove.desc': '此操作不可撤销。桶 {{name}} 将从本机桶目录删除,原本只属于该桶的可装软件包将不再出现在「浏览」页可装范围。',
    'dialog.remove.meta.source': '源',
    'dialog.remove.meta.apps': '桶内应用数',
    'dialog.remove.notice': '已装但属于该桶的软件包不会被卸载,仅不在 P05 中作为可装范围出现。',
    'dialog.remove.confirm': '确认移除',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.close': '关闭',
    'common.retry': '重试',
    'common.loading': '加载中',
    'common.unknown': '未知',
    'common.empty': '暂无匹配结果',
    'toast.add.success': '已发起添加桶 {{name}}',
    'toast.remove.success': '已发起移除桶 {{name}}',
    'toast.error.fallback': '操作失败',
    'footer.showing': '显示',
    'footer.of': '共',
    'footer.perPage': '每页',
  },
  'en-US': {
    'page.title': 'Buckets',
    'page.subtitle.addedKnown': '{{added}} added · {{known}} known',
    'page.subtitle.addedKnownInline': '{{count}} on this machine',
    'page.breadcrumb': 'Buckets',
    'page.actions.refresh': 'Refresh',
    'page.source': 'Source',
    'page.scoopOnline': 'Scoop online',
    'subbar.searchPlaceholder': 'Search bucket name or source…',
    'subbar.cta.addFromKnown': 'Add from known',
    'subbar.syncKnown': 'Sync known list',
    'subbar.help': 'Help',
    'subbar.hint': '{{known}} known · {{addable}} addable',
    'tabs.added': 'Added',
    'tabs.known': 'Known buckets',
    'tabs.addedCount': '{{count}}',
    'table.col.name': 'Bucket',
    'table.col.source': 'Source (GitHub)',
    'table.col.apps': 'Apps',
    'table.col.updated': 'Updated',
    'table.col.status': 'Status',
    'table.col.actions': 'Actions',
    'table.status.added': 'Added',
    'table.status.notAdded': 'Not added',
    'table.action.refresh': 'Refresh',
    'table.action.remove': 'Remove',
    'table.action.add': 'Add',
    'table.action.addedDisabled': 'Added',
    'table.empty.added.title': 'No buckets added',
    'table.empty.added.desc': 'Open the Known buckets tab to add an official Scoop bucket; manage it here afterwards.',
    'table.empty.added.cta': 'Browse known buckets',
    'error.known.title': 'Failed to load known buckets',
    'error.known.desc': 'Could not fetch the known bucket list from the official registry. Check your network or retry.',
    'error.known.code': 'Error code',
    'error.known.retry': 'Retry',
    'error.known.diagnose': 'Diagnose',
    'error.row.code': 'E_BUCKET_RM_FAILED',
    'error.row.stage': 'Stage',
    'error.row.stageValue': 'removing',
    'error.row.detail': 'Scoop exited with code 1. See P08 log for details.',
    'error.row.retry': 'Retry',
    'error.row.discard': 'Discard',
    'dialog.add.title': 'Add bucket',
    'dialog.add.titleWith': 'Add bucket {{name}}?',
    'dialog.add.desc': 'Will clone {{source}} into the local buckets directory and refresh available apps.',
    'dialog.add.meta.source': 'Source',
    'dialog.add.meta.apps': 'Apps',
    'dialog.add.notice': 'Network required. May take seconds to a minute; progress is shown in P08.',
    'dialog.add.confirm': 'Add bucket',
    'dialog.remove.title': 'Remove bucket',
    'dialog.remove.titleWith': 'Remove bucket {{name}}?',
    'dialog.remove.desc': 'This action cannot be undone. Bucket {{name}} will be removed from the local buckets directory; apps that belong only to this bucket will no longer appear under Browse.',
    'dialog.remove.meta.source': 'Source',
    'dialog.remove.meta.apps': 'Apps',
    'dialog.remove.notice': 'Already-installed apps belonging to this bucket will NOT be uninstalled; they just won\'t show up as installable in P05.',
    'dialog.remove.confirm': 'Remove bucket',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.retry': 'Retry',
    'common.loading': 'Loading',
    'common.unknown': 'Unknown',
    'common.empty': 'No matches',
    'toast.add.success': 'Adding bucket {{name}}…',
    'toast.remove.success': 'Removing bucket {{name}}…',
    'toast.error.fallback': 'Operation failed',
    'footer.showing': 'Showing',
    'footer.of': 'of',
    'footer.perPage': 'Per page',
  },
};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = params[key];
    return v === undefined || v === null ? `{{${key}}}` : String(v);
  });
}

function resolveLang(raw: string | undefined): Locale {
  if (raw && raw.toLowerCase().startsWith('en')) return 'en-US';
  return 'zh-CN';
}

function translate(lang: Locale, key: string, params?: Record<string, string | number>): string {
  const bundle = dict[lang] ?? dict['zh-CN'];
  const fallback = dict['zh-CN'];
  const raw = bundle[key] ?? fallback[key] ?? key;
  return interpolate(raw, params);
}

export function useT(): (key: string, params?: Record<string, string | number>) => string {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<Locale>(() => resolveLang(i18n.language));

  useEffect(() => {
    const onChange = (lng: string) => setLang(resolveLang(lng));
    i18n.on('languageChanged', onChange);
    return () => {
      i18n.off('languageChanged', onChange);
    };
  }, [i18n]);

  return (key, params) => translate(lang, key, params);
}

export function useLocale(): Locale {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<Locale>(() => resolveLang(i18n.language));
  useEffect(() => {
    const onChange = (lng: string) => setLang(resolveLang(lng));
    i18n.on('languageChanged', onChange);
    return () => {
      i18n.off('languageChanged', onChange);
    };
  }, [i18n]);
  return lang;
}