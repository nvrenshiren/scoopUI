import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { UILanguage } from '../../../shared/enums';

/**
 * 渲染端 i18n 配置
 * - 默认 zh-CN(本地用户)
 * - 切换:N1 设置页 P09(后续页面任务实现)
 * - 字符串保持轻量(MVP 占位);新增条目直接在 resources 补
 */

const resources = {
  'zh-CN': {
    common: {
      'common.appName': 'Scoop GUI',
      'common.cancel': '取消',
      'common.confirm': '确认',
      'common.close': '关闭',
      'common.retry': '重试',
      'common.refresh': '刷新',
      'common.search': '搜索',
      'common.empty': '暂无数据',
      'common.loading': '加载中',
      'common.theme.light': '亮色',
      'common.theme.dark': '暗色',
      'common.theme.system': '跟随系统',
    },
    onboarding: {
      'onboarding.title': '欢迎使用 Scoop GUI',
      'onboarding.detect.checking': '正在检测 Scoop',
      'onboarding.detect.found': '已检测到 Scoop {{version}}',
      'onboarding.detect.notFound': '未检测到 Scoop,需要先安装',
      'onboarding.install.prompt': '需要安装 Scoop 才能继续',
      'onboarding.install.submit': '开始安装',
      'onboarding.install.success': '安装完成',
      'onboarding.install.failure': '安装失败',
    },
    apps: {
      'apps.list.title': '已装软件包',
      'apps.list.search': '搜索软件包',
      'apps.list.empty': '尚未安装任何软件包',
      'apps.action.install': '安装',
      'apps.action.uninstall': '卸载',
      'apps.action.update': '更新',
      'apps.action.info': '详情',
      'apps.status.outdated': '有过更新',
      'apps.status.upToDate': '已是最新',
    },
    buckets: {
      'buckets.title': '桶管理',
      'buckets.add': '添加桶',
      'buckets.remove': '移除',
      'buckets.empty': '尚未添加任何桶',
    },
    settings: {
      'settings.title': '设置',
      'settings.language.label': '界面语言',
      'settings.theme.label': '主题',
      'settings.about': '关于',
    },
    progress: {
      'progress.title': '正在执行',
      'progress.downloading': '下载中',
      'progress.installing': '安装中',
      'progress.completed': '已完成',
      'progress.failed': '失败',
      'progress.cancelled': '已取消',
    },
    errors: {
      'errors.title': '出错了',
      'errors.unknown': '未知错误',
      'errors.permissionDenied': '权限不足',
      'errors.timeout': '操作超时',
      'errors.notFound': '未找到 Scoop',
      'errors.parseFailed': '输出解析失败',
    },
  },
  'en-US': {
    common: {
      'common.appName': 'Scoop GUI',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'common.close': 'Close',
      'common.retry': 'Retry',
      'common.refresh': 'Refresh',
      'common.search': 'Search',
      'common.empty': 'No data',
      'common.loading': 'Loading',
      'common.theme.light': 'Light',
      'common.theme.dark': 'Dark',
      'common.theme.system': 'System',
    },
    onboarding: {
      'onboarding.title': 'Welcome to Scoop GUI',
      'onboarding.detect.checking': 'Detecting Scoop',
      'onboarding.detect.found': 'Scoop {{version}} detected',
      'onboarding.detect.notFound': 'Scoop not detected, install required',
      'onboarding.install.prompt': 'Scoop is needed to continue',
      'onboarding.install.submit': 'Install',
      'onboarding.install.success': 'Install succeeded',
      'onboarding.install.failure': 'Install failed',
    },
    apps: {
      'apps.list.title': 'Installed apps',
      'apps.list.search': 'Search apps',
      'apps.list.empty': 'No installed apps',
      'apps.action.install': 'Install',
      'apps.action.uninstall': 'Uninstall',
      'apps.action.update': 'Update',
      'apps.action.info': 'Details',
      'apps.status.outdated': 'Outdated',
      'apps.status.upToDate': 'Up to date',
    },
    buckets: {
      'buckets.title': 'Buckets',
      'buckets.add': 'Add bucket',
      'buckets.remove': 'Remove',
      'buckets.empty': 'No buckets added',
    },
    settings: {
      'settings.title': 'Settings',
      'settings.language.label': 'UI language',
      'settings.theme.label': 'Theme',
      'settings.about': 'About',
    },
    progress: {
      'progress.title': 'In progress',
      'progress.downloading': 'Downloading',
      'progress.installing': 'Installing',
      'progress.completed': 'Completed',
      'progress.failed': 'Failed',
      'progress.cancelled': 'Cancelled',
    },
    errors: {
      'errors.title': 'Something went wrong',
      'errors.unknown': 'Unknown error',
      'errors.permissionDenied': 'Permission denied',
      'errors.timeout': 'Operation timed out',
      'errors.notFound': 'Scoop not found',
      'errors.parseFailed': 'Output parse failed',
    },
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: UILanguage.zhCN,
  fallbackLng: UILanguage.enUS,
  defaultNS: 'common',
  ns: ['common', 'onboarding', 'apps', 'buckets', 'settings', 'progress', 'errors'],
  interpolation: { escapeValue: false },
});

export default i18n;
