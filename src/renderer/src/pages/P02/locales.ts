import { UILanguage } from '../../../../shared/enums';

/**
 * P02 语言选择页文案(zh/en 双套,PRD §5「不得半中半英」)
 * - pageCopy:随当前界面语言切换的页面文案
 * - LANGUAGE_OPTIONS:语言卡片固定预览(每卡固定语言,不随页面语言变化)
 *   仅 zh-CN / en-US 两项(PRD §4「界面只展示中文和 English 两个选项」)
 */

export interface PageCopy {
  brand: string;
  step: string;
  title: string;
  subtitle: string;
  continue: string;
  saving: string;
  selectHint: string;
  footer: string;
  toast: {
    code: string;
    title: string;
    desc: string;
  };
}

export const pageCopy: Record<UILanguage, PageCopy> = {
  [UILanguage.zhCN]: {
    brand: 'scoopUI',
    step: '第 1 步 / 共 2 步 · 选择语言',
    title: '选择界面语言',
    subtitle: '本设置将决定所有界面文案的显示语言',
    continue: '继续',
    saving: '保存中…',
    selectHint: '请先选择语言',
    footer: '此次选择可稍后在“设置”中修改',
    toast: {
      code: 'E_PREFERENCES_WRITE_FAILED',
      title: '语言已即时生效',
      desc: '本机保存失败,下次启动可能需要重新选择',
    },
  },
  [UILanguage.enUS]: {
    brand: 'scoopUI',
    step: 'Step 1 of 2 · Choose language',
    title: 'Choose your display language',
    subtitle: 'This setting determines the language used throughout the interface',
    continue: 'Continue',
    saving: 'Saving…',
    selectHint: 'Please select a language',
    footer: 'You can change this later in Settings',
    toast: {
      code: 'E_PREFERENCES_WRITE_FAILED',
      title: 'Language applied',
      desc: 'Saving failed. You may need to choose again next time.',
    },
  },
};

export interface LanguageOption {
  value: UILanguage;
  name: string;
  code: string;
  preview: string[];
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: UILanguage.zhCN,
    name: '中文',
    code: 'zh-CN',
    preview: ['文件', '编辑', '设置', '帮助'],
  },
  {
    value: UILanguage.enUS,
    name: 'English',
    code: 'en-US',
    preview: ['File', 'Edit', 'Settings', 'Help'],
  },
];

export function resolvePageCopy(lang: string | undefined): PageCopy {
  return lang === UILanguage.enUS ? pageCopy[UILanguage.enUS] : pageCopy[UILanguage.zhCN];
}
