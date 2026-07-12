/**
 * P09 设置数据 hook
 * - 调用 window.scoop.getSettings / setSettings(IPC scoop:prefs:get / scoop:prefs:set)
 * - 失败约定:`data` 为 null 时上层走兜底;`error.code === 'E_PREFERENCES_WRITE_FAILED'` 时按 PRD §4 场景 4 提示
 * - 写入成功后立即更新本地缓存(zustand settings-store)以驱动 i18n.changeLanguage / theme 应用
 */
import { useCallback, useEffect, useState } from 'react';
import { UILanguage } from '../../../../../shared/enums';
import type { Preferences } from '../../../../../shared/ipc-contract';
import { useSettingsStore, DEFAULT_PREFS } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';
import i18n from '@/lib/i18n';
import { toast } from 'sonner';

const PERSIST_KEY = 'p09.lastSaveFailed';

export interface UseSettingsResult {
  prefs: Preferences;
  loading: boolean;
  saveFailed: boolean;
  refresh: () => Promise<void>;
  setLanguage: (lang: UILanguage) => Promise<void>;
  resetAll: () => Promise<void>;
}

function applyLanguage(lang: UILanguage) {
  void i18n.changeLanguage(lang);
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  useThemeStore.getState().setTheme(theme);
}

function showSaveFailedToast() {
  toast.error(i18n.t('p09.toast.saveFailed.title'), {
    id: 'p09.saveFailed',
    description: `${i18n.t('p09.toast.saveFailed.desc')} · ${i18n.t('p09.toast.code')}: E_PREFERENCES_WRITE_FAILED`,
  });
}

export function useSettings(): UseSettingsResult {
  const storedPrefs = useSettingsStore((s) => s.prefs);
  const setStoredPrefs = useSettingsStore((s) => s.setPrefs);

  const [loading, setLoading] = useState(false);
  const [saveFailed, setSaveFailed] = useState<boolean>(() => {
    return sessionStorage.getItem(PERSIST_KEY) === '1';
  });

  const persistSaveFailed = useCallback((failed: boolean) => {
    setSaveFailed(failed);
    if (failed) sessionStorage.setItem(PERSIST_KEY, '1');
    else sessionStorage.removeItem(PERSIST_KEY);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.scoop.getSettings();
      if (result.ok) {
        setStoredPrefs(result.data);
        applyLanguage(result.data.uiLanguage);
      } else {
        setStoredPrefs(DEFAULT_PREFS);
      }
    } finally {
      setLoading(false);
    }
  }, [setStoredPrefs]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setLanguage = useCallback(
    async (lang: UILanguage) => {
      applyLanguage(lang);
      persistSaveFailed(false);
      const result = await window.scoop.setSettings({ uiLanguage: lang });
      if (result.ok) {
        setStoredPrefs(result.data as Preferences);
      } else {
        persistSaveFailed(true);
        showSaveFailedToast();
      }
    },
    [persistSaveFailed, setStoredPrefs],
  );

  const resetAll = useCallback(async () => {
    applyLanguage(DEFAULT_PREFS.uiLanguage);
    applyTheme('dark');
    persistSaveFailed(false);
    const result = await window.scoop.setSettings({
      uiLanguage: DEFAULT_PREFS.uiLanguage,
    });
    if (result.ok) {
      setStoredPrefs({ ...result.data, uiLanguage: DEFAULT_PREFS.uiLanguage } as Preferences);
      toast.success(i18n.t('p09.section.danger.done'));
    } else {
      persistSaveFailed(true);
      showSaveFailedToast();
    }
  }, [persistSaveFailed, setStoredPrefs]);

  const prefs: Preferences = storedPrefs ?? DEFAULT_PREFS;

  return {
    prefs,
    loading,
    saveFailed,
    refresh,
    setLanguage,
    resetAll,
  };
}
