import { Package, Search, Layers, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/pages/P03/components/BrandLogo';
import { ThemeToggle } from '@/pages/P03/components/ThemeToggle';
import { translate, type Locale } from '@/pages/P03/locales';
import type { ReactNode } from 'react';

export type AppNavKey = 'installed' | 'browse' | 'buckets' | 'settings';

interface NavDef {
  key: AppNavKey;
  i18nKey: string;
  icon: ReactNode;
  path: string;
}

const NAV: NavDef[] = [
  { key: 'installed', i18nKey: 'p03.nav.installed', icon: <Package />, path: '/apps' },
  { key: 'browse', i18nKey: 'p03.nav.browse', icon: <Search />, path: '/browse' },
  { key: 'buckets', i18nKey: 'p03.nav.buckets', icon: <Layers />, path: '/buckets' },
  { key: 'settings', i18nKey: 'p03.nav.settings', icon: <Settings />, path: '/settings' },
];

const PATH_TO_KEY: Record<string, AppNavKey> = {
  '/apps': 'installed',
  '/browse': 'browse',
  '/buckets': 'buckets',
  '/settings': 'settings',
};

interface AppSidebarProps {
  version?: string;
  ready?: boolean;
  className?: string;
}

/**
 * 全局 AppSidebar:Brand + 1px 渐变线 + 4 项导航 + Footer(主题 + 语言)
 *
 * v2 选中态:`bg-primary/10 text-primary` + 左侧 2px primary 竖条 + 8px glow
 *
 * 导航用 react-router Link,激活态由 location.pathname 推导
 */
export function AppSidebar({ version, ready, className }: AppSidebarProps) {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN';
  const t = (key: string) => translate(key, locale);

  const location = useLocation();
  const active: AppNavKey = PATH_TO_KEY[location.pathname] ?? 'installed';

  return (
    <aside
      aria-label="Primary"
      className={cn(
        'relative flex h-full w-60 shrink-0 flex-col border-r border-border bg-bg-elevated',
        className,
      )}
    >
      <BrandLogo version={version} ready={ready} />

      <div
        aria-hidden="true"
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(to right, transparent, var(--primary) 50%, transparent)',
          opacity: 0.7,
        }}
      />

      <nav
        aria-label="Primary navigation"
        className="flex flex-1 flex-col gap-1 p-3"
      >
        {NAV.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-fg-muted hover:bg-bg-overlay hover:text-fg',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              )}
              style={
                isActive
                  ? {
                      boxShadow:
                        '0 0 0 1px rgba(34, 197, 94, 0.35) inset, 0 0 12px rgba(34, 197, 94, 0.12)',
                    }
                  : undefined
              }
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-primary transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
                style={
                  isActive
                    ? { boxShadow: '0 0 8px var(--primary-glow)' }
                    : undefined
                }
              />
              <span className="[&_svg]:h-[18px] [&_svg]:w-[18px]">{item.icon}</span>
              <span className="flex-1 truncate text-left">{t(item.i18nKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 border-t border-border p-3">
        <ThemeToggle label={t('p03.theme.label')} />
        <LangToggle />
      </div>
    </aside>
  );
}

function LangToggle() {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN';
  const isZh = i18n.language?.startsWith('zh') ?? true;
  return (
    <div
      role="group"
      aria-label={translate('p03.lang.label', locale)}
      className="flex h-8 gap-0.5 rounded-md border border-border bg-bg p-0.5"
    >
      <button
        type="button"
        onClick={() => void i18n.changeLanguage('zh-CN')}
        aria-pressed={isZh}
        className={cn(
          'flex-1 rounded-sm text-xs font-medium transition-colors',
          isZh ? 'text-fg' : 'text-fg-muted hover:text-fg',
        )}
        style={
          isZh
            ? {
                background: 'var(--bg-overlay)',
                boxShadow: 'inset 0 0 0 1px var(--border-strong)',
              }
            : undefined
        }
      >
        中
      </button>
      <button
        type="button"
        onClick={() => void i18n.changeLanguage('en-US')}
        aria-pressed={!isZh}
        className={cn(
          'flex-1 rounded-sm text-xs font-medium transition-colors',
          !isZh ? 'text-fg' : 'text-fg-muted hover:text-fg',
        )}
        style={
          !isZh
            ? {
                background: 'var(--bg-overlay)',
                boxShadow: 'inset 0 0 0 1px var(--border-strong)',
              }
            : undefined
        }
      >
        EN
      </button>
    </div>
  );
}