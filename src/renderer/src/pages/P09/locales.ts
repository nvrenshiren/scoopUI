/**
 * P09 设置与语言切换页 · 翻译资源
 * - 命名空间:`p09`(`p09.section.*` / `p09.lang.*` / `p09.theme.*` / `p09.path.*` / `p09.danger.*`)
 * - 加载方式:index.tsx 调用 `i18n.addResourceBundle` 注册
 * - zh-CN / en-US 双语,与全局 i18n.ts 同源(UILanguage 枚举)
 */
export const p09Resources = {
  'zh-CN': {
    p09: {
      'p09.page.title': '设置',
      'p09.page.subtitle': '偏好与界面语言',

      'p09.section.language': '界面语言',
      'p09.section.language.desc': '选择中文或 English,切换后立即生效。',
      'p09.section.language.channel': 'scoop:prefs:set',
      'p09.section.language.current': '当前语言',
      'p09.section.language.current.desc': '下次启动将默认使用此语言',
      'p09.section.language.code.zh': 'zh-CN',
      'p09.section.language.code.en': 'en-US',
      'p09.section.language.option.zh.label': '中文',
      'p09.section.language.option.zh.desc': '简体中文 · zh-CN',
      'p09.section.language.option.en.label': 'English',
      'p09.section.language.option.en.desc': 'English (US) · en-US',

      'p09.section.theme': '主题',
      'p09.section.theme.desc': '暗色为默认主推,亮色作为备选。',
      'p09.section.theme.default': '默认:暗',
      'p09.section.theme.light.label': '亮',
      'p09.section.theme.light.desc': '浅色界面',
      'p09.section.theme.dark.label': '暗',
      'p09.section.theme.dark.desc': '默认暗色',
      'p09.section.theme.system.label': '跟随系统',
      'p09.section.theme.system.desc': '匹配系统外观',

      'p09.section.path': 'Scoop 路径',
      'p09.section.path.desc': '当前检测到的 Scoop 可执行文件位置(只读)。',
      'p09.section.path.placeholder': '尚未检测到 Scoop',
      'p09.section.path.version.label': '版本',
      'p09.section.path.detect': '重新检测',

      'p09.section.danger': '重置设置',
      'p09.section.danger.desc': '将界面语言与主题恢复为默认,不影响 Scoop 与已装软件包。',
      'p09.section.danger.action': '重置设置',
      'p09.section.danger.confirm.title': '确认重置设置?',
      'p09.section.danger.confirm.desc':
        '界面语言与主题会恢复为默认。本机 Scoop、桶与已装软件包不受影响。',
      'p09.section.danger.confirm.submit': '确认重置',
      'p09.section.danger.cancel': '取消',
      'p09.section.danger.done': '设置已重置',

      'p09.toast.saveFailed.title': '设置已应用,但保存失败',
      'p09.toast.saveFailed.desc': '本次更改已生效,但下次启动可能回退。',
      'p09.toast.code': '错误码',
    },
  },
  'en-US': {
    p09: {
      'p09.page.title': 'Settings',
      'p09.page.subtitle': 'Preferences & UI language',

      'p09.section.language': 'Interface language',
      'p09.section.language.desc': 'Choose Chinese or English. Changes apply immediately.',
      'p09.section.language.channel': 'scoop:prefs:set',
      'p09.section.language.current': 'Current language',
      'p09.section.language.current.desc': 'Next launch will use this language by default',
      'p09.section.language.code.zh': 'zh-CN',
      'p09.section.language.code.en': 'en-US',
      'p09.section.language.option.zh.label': '中文',
      'p09.section.language.option.zh.desc': 'Simplified Chinese · zh-CN',
      'p09.section.language.option.en.label': 'English',
      'p09.section.language.option.en.desc': 'English (US) · en-US',

      'p09.section.theme': 'Theme',
      'p09.section.theme.desc': 'Dark is the recommended default. Light remains available.',
      'p09.section.theme.default': 'Default: Dark',
      'p09.section.theme.light.label': 'Light',
      'p09.section.theme.light.desc': 'Light interface',
      'p09.section.theme.dark.label': 'Dark',
      'p09.section.theme.dark.desc': 'Default dark',
      'p09.section.theme.system.label': 'System',
      'p09.section.theme.system.desc': 'Match OS appearance',

      'p09.section.path': 'Scoop path',
      'p09.section.path.desc': 'Detected Scoop executable location (read-only).',
      'p09.section.path.placeholder': 'Scoop not detected yet',
      'p09.section.path.version.label': 'Version',
      'p09.section.path.detect': 'Re-detect',

      'p09.section.danger': 'Reset settings',
      'p09.section.danger.desc':
        'Restore UI language and theme to defaults. Does not affect Scoop or installed packages.',
      'p09.section.danger.action': 'Reset settings',
      'p09.section.danger.confirm.title': 'Confirm reset settings?',
      'p09.section.danger.confirm.desc':
        'UI language and theme will be restored to defaults. Scoop, buckets, and installed packages are not affected.',
      'p09.section.danger.confirm.submit': 'Confirm reset',
      'p09.section.danger.cancel': 'Cancel',
      'p09.section.danger.done': 'Settings reset',

      'p09.toast.saveFailed.title': 'Settings applied, but saving failed',
      'p09.toast.saveFailed.desc': 'The change is active now, but next launch may revert.',
      'p09.toast.code': 'Error code',
    },
  },
} as const;

export type P09Key = keyof (typeof p09Resources)['zh-CN']['p09'];
