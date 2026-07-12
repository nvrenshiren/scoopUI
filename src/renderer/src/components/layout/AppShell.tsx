import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { AppSidebar } from './AppSidebar';
import { useThemeStore } from '@/stores/theme-store';
import { resolveTheme } from '../../../../shared/theme';

export function AppShell() {
  const theme = useThemeStore((s) => s.theme);
  const setResolved = useThemeStore((s) => s.setResolved);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolved(resolved);
    const root = document.documentElement;
    if (resolved === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme, setResolved]);

  return (
    <div className="flex h-full w-full">
      <AppSidebar version="0.5.3" ready={true} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}