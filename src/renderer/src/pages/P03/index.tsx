import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { translate, type Locale } from './locales';

const TITLE_KEY = 'p03.header.title.installed';
const CRUMB_KEY = 'p03.header.crumb.installed';
const SEARCH_KEY = 'p03.header.search';
const HINT_KEY = 'p03.header.searchHint';
const STATUS_KEY = 'p03.header.status';
const WELCOME_TITLE = 'p03.welcome.title';
const WELCOME_DESC = 'p03.welcome.desc';
const WELCOME_META = 'p03.welcome.meta';

/**
 * P03 主界面默认页
 * 仅渲染 PageHeader + welcome placeholder(无 Sidebar,Sidebar 由 AppShell 提供)
 */
export default function P03Page() {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN';
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(key, locale, vars);

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-grid bg-glow-top"
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header
          className="relative flex h-14 shrink-0 items-center gap-4 border-b border-border px-6 backdrop-blur"
          style={{ background: 'rgba(17, 24, 39, 0.6)' }}
        >
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, var(--primary) 25%, var(--accent) 50%, var(--primary) 75%, transparent)',
              opacity: 0.7,
            }}
          />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold leading-tight tracking-tight text-fg">
              {t(TITLE_KEY)}
            </h1>
            <p className="mt-0.5 font-mono text-[11px] text-fg-subtle">
              scoop-gui / {t(CRUMB_KEY)}
            </p>
          </div>
          <div className="flex-1" />

          <button
            type="button"
            aria-label={t(SEARCH_KEY)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-overlay px-2.5 text-[13px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span>{t(SEARCH_KEY)}</span>
            <kbd className="ml-1 rounded border border-border bg-bg px-1.5 py-px font-mono text-[11px] leading-snug text-fg-subtle">
              {t(HINT_KEY)}
            </kbd>
          </button>

          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-overlay px-2.5 py-1 text-xs"
            style={{ color: 'var(--primary)' }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              style={{ boxShadow: '0 0 6px var(--primary)' }}
            />
            {t(STATUS_KEY)}
          </span>
        </header>

        <main className="flex flex-1 items-center justify-center overflow-auto p-8">
          <div className="relative max-w-[560px] text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl text-primary"
              style={{
                background:
                  'linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(96, 165, 250, 0.12))',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                boxShadow:
                  '0 0 32px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <Search className="h-7 w-7" strokeWidth={1.6} />
            </div>
            <h2 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-fg">
              {t(WELCOME_TITLE)}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
              {t(WELCOME_DESC)}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 font-mono text-[11px] text-fg-subtle">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                style={{ boxShadow: '0 0 6px var(--primary)' }}
              />
              <span>{t(WELCOME_META, { size: '1280 × 800', theme: 'dark' })}</span>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}