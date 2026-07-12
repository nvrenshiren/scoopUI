/**
 * P03 页面本地翻译资源(zh-CN / en-US)
 *
 * 与现有 i18n.ts resources 结构对齐(key 形如 `<namespace>.<key>`),
 * 当前 P03 命名空间:`p03`。
 *
 * 接入方式(后续任务按需):
 *   import { p03Resources } from '@/pages/P03/locales';
 *   i18n.addResourceBundle('zh-CN', 'p03', p03Resources['zh-CN']);
 *   i18n.addResourceBundle('en-US', 'p03', p03Resources['en-US']);
 *
 * 当前 P03 组件直接 import 本文件的 `t('p03.*')` 通过 inline lookup,
 * 不依赖 i18n 实例,避免修改全局 i18n 配置(本任务不修改 lib/i18n.ts)。
 */

export type Locale = 'zh-CN' | 'en-US';

export const p03Resources: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'p03.brand.title': 'scoop-gui',
    'p03.brand.subtitle': 'Scoop 可用 · v{{version}}',
    'p03.nav.installed': '已装',
    'p03.nav.browse': '浏览',
    'p03.nav.buckets': '桶',
    'p03.nav.settings': '设置',
    'p03.theme.label': '主题',
    'p03.theme.light': '亮',
    'p03.theme.dark': '暗',
    'p03.theme.system': '跟随',
    'p03.lang.label': '语言',
    'p03.header.title.installed': '已装软件包',
    'p03.header.title.browse': '浏览软件包',
    'p03.header.title.buckets': '桶管理',
    'p03.header.title.settings': '设置',
    'p03.header.crumb.installed': 'installed',
    'p03.header.crumb.browse': 'browse',
    'p03.header.crumb.buckets': 'buckets',
    'p03.header.crumb.settings': 'settings',
    'p03.header.search': '全局搜索',
    'p03.header.searchHint': 'Ctrl K',
    'p03.header.status': 'Scoop 可用',
    'p03.welcome.title': '欢迎使用 scoop-gui',
    'p03.welcome.desc':
      '从左侧选择「已装 / 浏览 / 桶 / 设置」开始管理本机 Scoop。本页只承载主界面壳与导航上下文,具体内容由 P04 / P05 / P06 / P09 渲染。',
    'p03.welcome.meta': '{{size}} · {{theme}} · v2 design system',
  },
  'en-US': {
    'p03.brand.title': 'scoop-gui',
    'p03.brand.subtitle': 'Scoop ready · v{{version}}',
    'p03.nav.installed': 'Installed',
    'p03.nav.browse': 'Browse',
    'p03.nav.buckets': 'Buckets',
    'p03.nav.settings': 'Settings',
    'p03.theme.label': 'Theme',
    'p03.theme.light': 'Light',
    'p03.theme.dark': 'Dark',
    'p03.theme.system': 'Auto',
    'p03.lang.label': 'Language',
    'p03.header.title.installed': 'Installed Apps',
    'p03.header.title.browse': 'Browse Apps',
    'p03.header.title.buckets': 'Buckets',
    'p03.header.title.settings': 'Settings',
    'p03.header.crumb.installed': 'installed',
    'p03.header.crumb.browse': 'browse',
    'p03.header.crumb.buckets': 'buckets',
    'p03.header.crumb.settings': 'settings',
    'p03.header.search': 'Search',
    'p03.header.searchHint': 'Ctrl K',
    'p03.header.status': 'Scoop ready',
    'p03.welcome.title': 'Welcome to scoop-gui',
    'p03.welcome.desc':
      'Use the sidebar to manage installed apps, browse apps, buckets, or settings. This shell only hosts navigation; actual content is rendered by P04 / P05 / P06 / P09.',
    'p03.welcome.meta': '{{size}} · {{theme}} · v2 design system',
  },
};

export function translate(
  key: string,
  locale: Locale,
  vars?: Record<string, string | number>,
): string {
  const dict = p03Resources[locale];
  let raw = dict[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      raw = raw.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return raw;
}