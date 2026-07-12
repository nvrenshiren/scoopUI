import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { UILanguage } from '../../../../../shared/enums';
import { isErr } from '../../../../../shared/ipc-result';
import { useSettingsStore } from '@/stores/settings-store';

/**
 * 语言选择持久化 hook(F13)
 * - 通过 TanStack Query mutation 调用 window.scoop.setSettings({ uiLanguage })
 * - 无论保存成功与否都先立即切换 i18n 语言(PRD 场景 4:本次即时生效)
 * - 保存失败时向上抛出,由页面以 Sonner 告知「即时生效 / 下次可能回退」
 */
export interface UseLanguageResult {
  /** 立即切换当前界面语言(即时生效) */
  applyNow: (lang: UILanguage) => void;
  /** 持久化到本机,返回是否成功持久化 */
  persist: (lang: UILanguage) => Promise<boolean>;
  isSaving: boolean;
}

export function useLanguage(): UseLanguageResult {
  const { i18n } = useTranslation();
  const setPrefs = useSettingsStore((s) => s.setPrefs);
  const prefs = useSettingsStore((s) => s.prefs);

  const applyNow = (lang: UILanguage): void => {
    void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  };

  const mutation = useMutation<boolean, Error, UILanguage>({
    mutationFn: async (lang) => {
      applyNow(lang);
      const result = await window.scoop.setSettings({ uiLanguage: lang });
      if (isErr(result)) {
        return false;
      }
      setPrefs({
        uiLanguage: lang,
        onboardingCompleted: prefs?.onboardingCompleted ?? false,
        ...(prefs?.scoopInstallConfig ? { scoopInstallConfig: prefs.scoopInstallConfig } : {}),
        ...(prefs?.windowBounds ? { windowBounds: prefs.windowBounds } : {}),
      });
      return true;
    },
  });

  return {
    applyNow,
    persist: (lang) => mutation.mutateAsync(lang),
    isSaving: mutation.isPending,
  };
}
