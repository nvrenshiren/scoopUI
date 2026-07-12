/**
 * next-themes 兼容的 useTheme hook(API 形态对齐 `useTheme` from 'next-themes')
 * 内部桥接到项目现有 zustand theme-store(@/stores/theme-store):
 *   - 不引入 next-themes Provider,避免与 App.tsx 中 ThemeEffect 在 <html> 上的 class 写入冲突
 *   - 持久化仍由 zustand persist(中间件)负责,key='scoop-gui.theme'
 *   - 组件层调用方式与 next-themes 完全一致:`const { theme, resolvedTheme, setTheme } = useTheme()`
 * 后续如需迁移到 next-themes Provider,只需替换 hook 内部即可,组件无改动。
 */
import { useCallback } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { resolveTheme, type Theme } from '../../../shared/theme';

export interface UseThemeReturn {
  themes: string[];
  forcedTheme?: string;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  theme: Theme;
  systemTheme: 'light' | 'dark' | undefined;
}

const THEMES: string[] = ['light', 'dark', 'system'];

export function useTheme(): UseThemeReturn {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const setResolved = useThemeStore((s) => s.setResolved);

  const setThemeAndResolved = useCallback(
    (next: Theme) => {
      setTheme(next);
      setResolved(resolveTheme(next));
    },
    [setTheme, setResolved],
  );

  const systemTheme: 'light' | 'dark' | undefined =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : undefined;

  return {
    themes: THEMES,
    resolvedTheme: resolveTheme(theme),
    setTheme: setThemeAndResolved,
    theme,
    systemTheme,
  };
}