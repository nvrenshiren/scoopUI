import { create } from 'zustand';
import type { Preferences } from '../../../shared/ipc-contract';

interface SettingsState {
  prefs: Preferences | null;
  loaded: boolean;
  setPrefs: (p: Preferences) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  prefs: null,
  loaded: false,
  setPrefs: (p) => set({ prefs: p, loaded: true }),
}));

export const DEFAULT_PREFS: Preferences = {
  uiLanguage: 'zh-CN',
  onboardingCompleted: false,
};
