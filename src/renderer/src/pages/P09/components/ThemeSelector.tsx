/**
 * P09 主题三选一(light / dark / system)
 * - 复用 `useThemeStore`(zustand persist + ThemeEffect 已处理 .dark 切换)
 * - 仅前端状态,不入 prefs(theme 本地优先,见 theme-store.ts 注释)
 */
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '../../../../../shared/theme';
import { useThemeStore } from '@/stores/theme-store';

export interface ThemeSelectorProps {
  value: Theme;
}

interface ThemeOption {
  value: Theme;
  labelKey: string;
  descKey: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    labelKey: 'p09.section.theme.light.label',
    descKey: 'p09.section.theme.light.desc',
    Icon: Sun,
  },
  {
    value: 'dark',
    labelKey: 'p09.section.theme.dark.label',
    descKey: 'p09.section.theme.dark.desc',
    Icon: Moon,
  },
  {
    value: 'system',
    labelKey: 'p09.section.theme.system.label',
    descKey: 'p09.section.theme.system.desc',
    Icon: Monitor,
  },
];

export function ThemeSelector({ value }: ThemeSelectorProps) {
  const { t } = useTranslation('p09');
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'group flex min-h-[116px] flex-col justify-between gap-3 rounded-lg border bg-bg-elevated/80 p-4 text-left text-fg transition-all',
              'hover:border-border-strong hover:bg-bg-overlay',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              selected &&
                'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_24px_rgba(34,197,94,0.16)]',
            )}
          >
            <span className="flex items-center justify-between">
              <Icon className="h-6 w-6" />
              <span
                aria-hidden
                className={cn(
                  'text-primary transition-all',
                  selected ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
                )}
              >
                <Check className="h-4.5 w-4.5" />
              </span>
            </span>
            <span className="text-left">
              <span className="font-display block text-base font-semibold">
                {t(opt.labelKey)}
              </span>
              <span className="mt-1 block text-xs text-fg-muted">{t(opt.descKey)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
