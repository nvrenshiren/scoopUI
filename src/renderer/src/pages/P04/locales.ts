/**
 * P04 页面本地翻译资源(zh-CN / en-US)
 *
 * 与 P03 / P07 模式一致:页面级翻译不进全局 i18n.ts,
 * 组件通过 `useLang()` + `t(key)`(本文件导出的 helper)解析。
 */

export type Locale = 'zh-CN' | 'en-US';

export const p04Resources: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'p04.title': '已装软件包',
    'p04.crumb': 'installed',
    'p04.summary.total': '共 {{total}} 个 · {{outdated}} 个过期',
    'p04.summary.totalShort': '{{total}} 个',
    'p04.summary.outdatedShort': '{{outdated}} 个过期',

    'p04.search.placeholder': '搜索已装软件包…',
    'p04.search.ariaLabel': '搜索已装软件包',

    'p04.filter.all': '全部',
    'p04.filter.outdated': '过期',
    'p04.filter.normal': '正常',
    'p04.filter.bucket': '桶筛选',
    'p04.filter.sort': '排序',
    'p04.filter.sortName': '按名称',
    'p04.filter.sortUpdated': '按更新时间',
    'p04.filter.sortVersion': '按版本',

    'p04.actions.updateAll': '更新所有过期',
    'p04.actions.uninstallSelected': '卸载选中',
    'p04.actions.updateSelected': '更新选中',
    'p04.actions.browseApps': '浏览可装软件包',
    'p04.actions.refresh': '刷新',
    'p04.actions.diagnose': '诊断',
    'p04.actions.confirmUpdate': '确认更新',
    'p04.actions.confirmUninstall': '确认卸载',
    'p04.actions.cancel': '取消',
    'p04.actions.close': '关闭',
    'p04.actions.more': '更多操作',

    'p04.table.col.name': '名称',
    'p04.table.col.version': '版本',
    'p04.table.col.source': '来源',
    'p04.table.col.updated': '更新时间',
    'p04.table.col.status': '状态',
    'p04.table.col.actions': '操作',
    'p04.table.col.checkbox': '选择',
    'p04.table.col.checkboxAll': '全选',

    'p04.status.outdated': '过期',
    'p04.status.upToDate': '已是最新',
    'p04.status.latestHint': '可更新到 {{latest}}',
    'p04.status.uninstalled': '已卸载',
    'p04.status.updated': '已更新',

    'p04.row.action.update': '更新',
    'p04.row.action.uninstall': '卸载',
    'p04.row.action.details': '查看详情',
    'p04.row.action.copyName': '复制名称',

    'p04.tooltip.outdated': '该软件包有过更新版本,点击更新获取最新功能与修复',

    'p04.dialog.updateAll.title': '更新所有过期软件包',
    'p04.dialog.updateAll.desc':
      '将依次更新以下 {{count}} 个过期软件包。更新过程中可关闭窗口,任务会继续在后台运行。',
    'p04.dialog.updateAll.listLabel': '即将更新的软件包',

    'p04.dialog.uninstall.title': '卸载 {{name}}?',
    'p04.dialog.uninstall.desc':
      '此操作不可撤销。{{name}} {{version}} 及其关联文件将被从本机移除。',
    'p04.dialog.uninstall.note':
      '若仍属于已添加桶范围,可在「浏览」页重新安装。',

    'p04.empty.title': '暂无已装软件包',
    'p04.empty.desc':
      '通过「浏览」页安装第一个应用即可在此看到它的列表状态。',
    'p04.error.title': '无法加载已装软件包',
    'p04.error.desc': '请稍后重试,或检查 Scoop 是否可用。',
    'p04.error.code': '错误码',
    'p04.error.codeFallback': '未知错误',

    'p04.footer.showing': '显示 {{from}}-{{to}} 共 {{total}}',
    'p04.footer.perPage': '每页 {{count}}',
    'p04.footer.selected': '已选 {{count}}',

    'p04.mutation.updating': '正在更新 {{name}}…',
    'p04.mutation.uninstalling': '正在卸载 {{name}}…',
    'p04.mutation.updateSuccess': '{{name}} 已更新到 {{version}}',
    'p04.mutation.uninstallSuccess': '{{name}} 已卸载',
    'p04.mutation.failure': '操作失败: {{message}}',
    'p04.mutation.batchStart': '已开始批量更新 {{count}} 个软件包',
    'p04.mutation.batchFailure': '批量更新启动失败',

    'p04.notice.liveSync': '实时同步',

    'p04.loading': '正在加载已装软件包…',
  },
  'en-US': {
    'p04.title': 'Installed apps',
    'p04.crumb': 'installed',
    'p04.summary.total': '{{total}} total · {{outdated}} outdated',
    'p04.summary.totalShort': '{{total}} total',
    'p04.summary.outdatedShort': '{{outdated}} outdated',

    'p04.search.placeholder': 'Search installed apps…',
    'p04.search.ariaLabel': 'Search installed apps',

    'p04.filter.all': 'All',
    'p04.filter.outdated': 'Outdated',
    'p04.filter.normal': 'Up-to-date',
    'p04.filter.bucket': 'Bucket',
    'p04.filter.sort': 'Sort',
    'p04.filter.sortName': 'Name',
    'p04.filter.sortUpdated': 'Updated',
    'p04.filter.sortVersion': 'Version',

    'p04.actions.updateAll': 'Update all outdated',
    'p04.actions.uninstallSelected': 'Uninstall selected',
    'p04.actions.updateSelected': 'Update selected',
    'p04.actions.browseApps': 'Browse apps',
    'p04.actions.refresh': 'Refresh',
    'p04.actions.diagnose': 'Diagnose',
    'p04.actions.confirmUpdate': 'Update',
    'p04.actions.confirmUninstall': 'Uninstall',
    'p04.actions.cancel': 'Cancel',
    'p04.actions.close': 'Close',
    'p04.actions.more': 'More',

    'p04.table.col.name': 'Name',
    'p04.table.col.version': 'Version',
    'p04.table.col.source': 'Source',
    'p04.table.col.updated': 'Updated',
    'p04.table.col.status': 'Status',
    'p04.table.col.actions': 'Actions',
    'p04.table.col.checkbox': 'Select',
    'p04.table.col.checkboxAll': 'Select all',

    'p04.status.outdated': 'Outdated',
    'p04.status.upToDate': 'Up to date',
    'p04.status.latestHint': 'Update to {{latest}}',
    'p04.status.uninstalled': 'Uninstalled',
    'p04.status.updated': 'Updated',

    'p04.row.action.update': 'Update',
    'p04.row.action.uninstall': 'Uninstall',
    'p04.row.action.details': 'View details',
    'p04.row.action.copyName': 'Copy name',

    'p04.tooltip.outdated':
      'A newer version is available. Click to update and get the latest features and fixes.',

    'p04.dialog.updateAll.title': 'Update all outdated apps',
    'p04.dialog.updateAll.desc':
      '{{count}} outdated apps will be updated in sequence. You can close this window — the job continues in background.',
    'p04.dialog.updateAll.listLabel': 'Apps to update',

    'p04.dialog.uninstall.title': 'Uninstall {{name}}?',
    'p04.dialog.uninstall.desc':
      'This action cannot be undone. {{name}} {{version}} and its files will be removed from this machine.',
    'p04.dialog.uninstall.note':
      'If still in a known bucket, you can re-install from the Browse page.',

    'p04.empty.title': 'No installed apps yet',
    'p04.empty.desc': 'Install your first app from the Browse tab to populate this list.',
    'p04.error.title': 'Failed to load installed apps',
    'p04.error.desc': 'Please retry, or verify that Scoop is available.',
    'p04.error.code': 'Error code',
    'p04.error.codeFallback': 'Unknown error',

    'p04.footer.showing': 'Showing {{from}}-{{to}} of {{total}}',
    'p04.footer.perPage': 'Per page: {{count}}',
    'p04.footer.selected': 'Selected {{count}}',

    'p04.mutation.updating': 'Updating {{name}}…',
    'p04.mutation.uninstalling': 'Uninstalling {{name}}…',
    'p04.mutation.updateSuccess': '{{name}} updated to {{version}}',
    'p04.mutation.uninstallSuccess': '{{name}} uninstalled',
    'p04.mutation.failure': 'Operation failed: {{message}}',
    'p04.mutation.batchStart': 'Started batch update for {{count}} apps',
    'p04.mutation.batchFailure': 'Failed to start batch update',

    'p04.notice.liveSync': 'Live sync',

    'p04.loading': 'Loading installed apps…',
  },
};

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const v = vars[k];
    return v === undefined || v === null ? `{{${k}}}` : String(v);
  });
}

export function lookup(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = p04Resources[locale] ?? p04Resources['zh-CN'];
  const raw = dict[key] ?? p04Resources['zh-CN'][key] ?? key;
  return interpolate(raw, vars);
}