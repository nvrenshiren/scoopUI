import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME, type Theme } from '../../../shared/theme';

interface ThemeState {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  setResolved: (r: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      resolved: 'dark',
      setTheme: (t) => set({ theme: t }),
      setResolved: (r) => set({ resolved: r }),
    }),
    {
      name: 'scoop-gui.theme',
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
);
