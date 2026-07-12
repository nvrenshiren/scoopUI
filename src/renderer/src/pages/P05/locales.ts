/**
 * P05 浏览与搜索软件包页 · 国际化文案
 * 通过 i18n.addResourceBundle 注入到现有 i18n 实例,避免修改 lib/i18n.ts
 * 命名空间:'p05'
 */

import i18n from '@/lib/i18n';

export const P05_NS = 'p05';

const zh = {
  'p05.title': '浏览软件包',
  'p05.path': '/ browse',
  'p05.search.placeholder': '搜索已添加桶中的软件包…',
  'p05.search.kbd.mac': '⌘ K',
  'p05.search.kbd.other': 'Ctrl K',
  'p05.search.clear': '清空查询',
  'p05.bucketSummary': '{{buckets}} 桶 · {{apps}} 包',
  'p05.refresh': '刷新',
  'p05.tab.all': '全部',
  'p05.tab.available': '可装未装',
  'p05.tab.installed': '已装',
  'p05.sort.label': '排序',
  'p05.sort.byName': '按名称',
  'p05.col.name': '名称',
  'p05.col.version': '版本',
  'p05.col.bucket': '桶',
  'p05.col.updated': '更新时间',
  'p05.col.info': '备注',
  'p05.col.action': '操作',
  'p05.status.installed': '已装',
  'p05.empty.title': '没有匹配的软件包',
  'p05.empty.desc': '试试调整关键字,或清空查询查看全部可装软件包。',
  'p05.empty.query': '查询',
  'p05.empty.clear': '清空查询',
  'p05.empty.manage': '管理桶',
  'p05.empty.noBuckets.title': '暂无软件包',
  'p05.empty.noBuckets.desc': '当前没有可装软件包,请先在桶管理中添加桶。',
  'p05.empty.noBuckets.cta': '前往桶管理',
  'p05.error.title': '读取失败',
  'p05.error.desc': '加载软件包列表失败,请稍后重试。',
  'p05.error.retry': '重试',
  'p05.install.started': '已开始安装 {{name}}',
  'p05.install.failed': '安装失败:{{message}}',
  'p05.install.alreadyInstalled': '{{name}} 已安装',
};

const en = {
  'p05.title': 'Browse apps',
  'p05.path': '/ browse',
  'p05.search.placeholder': 'Search apps in added buckets…',
  'p05.search.kbd.mac': '⌘ K',
  'p05.search.kbd.other': 'Ctrl K',
  'p05.search.clear': 'Clear query',
  'p05.bucketSummary': '{{buckets}} buckets · {{apps}} apps',
  'p05.refresh': 'Refresh',
  'p05.tab.all': 'All',
  'p05.tab.available': 'Available',
  'p05.tab.installed': 'Installed',
  'p05.sort.label': 'Sort',
  'p05.sort.byName': 'By name',
  'p05.col.name': 'Name',
  'p05.col.version': 'Version',
  'p05.col.bucket': 'Bucket',
  'p05.col.updated': 'Updated',
  'p05.col.info': 'Info',
  'p05.col.action': 'Action',
  'p05.status.installed': 'installed',
  'p05.empty.title': 'No matching apps',
  'p05.empty.desc': 'Try a different keyword, or clear the query to see all available apps.',
  'p05.empty.query': 'Query',
  'p05.empty.clear': 'Clear query',
  'p05.empty.manage': 'Manage buckets',
  'p05.empty.noBuckets.title': 'No apps yet',
  'p05.empty.noBuckets.desc': 'No apps are available. Add a bucket first to start browsing.',
  'p05.empty.noBuckets.cta': 'Go to buckets',
  'p05.error.title': 'Failed to load',
  'p05.error.desc': 'Could not load the app list. Please try again.',
  'p05.error.retry': 'Retry',
  'p05.install.started': 'Installing {{name}}',
  'p05.install.failed': 'Install failed: {{message}}',
  'p05.install.alreadyInstalled': '{{name}} is already installed',
};

i18n.addResourceBundle('zh-CN', P05_NS, zh, true, true);
i18n.addResourceBundle('en-US', P05_NS, en, true, true);