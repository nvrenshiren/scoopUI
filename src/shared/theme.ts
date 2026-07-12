export type Theme = 'light' | 'dark' | 'system';

export interface ThemeSettings {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: 'light' | 'dark';
}

export const THEME_STORAGE_KEY = 'scoop-gui.theme';
export const DEFAULT_THEME: Theme = 'dark';

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
