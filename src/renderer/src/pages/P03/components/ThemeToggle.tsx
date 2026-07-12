import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';
import { translate, type Locale } from '../locales';
import type { Theme } from '../../../../../shared/theme';

interface ThemeToggleProps {
  className?: string;
  /** 标签文本(已翻译);若不传则从 locales 读取(需在 P03 上下文中) */
  label?: string;
}

/**
 * Sidebar Footer 主题切换(light / dark / system)
 * v2 token:active 态 `bg-bg-overlay text-primary` + inset ring of primary
 */
export function ThemeToggle({ className, label }: ThemeToggleProps) {
  const { theme, setTheme, themes } = useTheme();
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN';
  const displayLabel = label ?? translate('p03.theme.label', locale);

  const options: Array<{ value: Theme; icon: React.ReactNode; label: string }> = [
    { value: 'light', icon: <Sun className="h-[13px] w-[13px]" />, label: translate('p03.theme.light', locale) },
    { value: 'dark', icon: <Moon className="h-[13px] w-[13px]" />, label: translate('p03.theme.dark', locale) },
    { value: 'system', icon: <Monitor className="h-[13px] w-[13px]" />, label: translate('p03.theme.system', locale) },
  ];

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="px-1 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
        {displayLabel}
      </span>
      <div
        role="tablist"
        aria-label="Theme"
        className="flex h-8 gap-0.5 rounded-md border border-border bg-bg p-0.5"
      >
        {options.map((opt) => {
          const active = theme === opt.value;
          const supported = themes.includes(opt.value);
          return (
            <button
              key={opt.value}
              role="tab"
              type="button"
              aria-selected={active}
              disabled={!supported}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-1 rounded-sm text-xs font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-fg-muted hover:text-fg',
              )}
              style={
                active
                  ? {
                      background: 'var(--bg-overlay)',
                      boxShadow: 'inset 0 0 0 1px rgba(34, 197, 94, 0.3)',
                    }
                  : undefined
              }
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}