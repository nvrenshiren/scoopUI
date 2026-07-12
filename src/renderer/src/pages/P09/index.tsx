/**
 * P09 设置与语言切换页
 * - PRD:docs/prd/pages/electron/scoop-gui/P09-设置与语言切换页.md
 * - 原型:docs/design/prototypes/electron/scoop-gui/P09-设置与语言切换页.html
 * - API:scoop:prefs:get / scoop:prefs:set
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { SettingSection } from './components/SettingSection';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ThemeSelector } from './components/ThemeSelector';
import { ScoopPathConfig } from './components/ScoopPathConfig';
import { DangerZone } from './components/DangerZone';
import { useSettings } from './hooks/use-settings';
import { useThemeStore } from '@/stores/theme-store';
import { p09Resources } from './locales';

let p09Registered = false;
function registerP09Locales() {
  if (p09Registered) return;
  for (const [lng, ns] of Object.entries(p09Resources)) {
    const resources = (ns as { p09: Record<string, string> }).p09;
    i18n.addResourceBundle(lng, 'p09', resources, true, true);
  }
  p09Registered = true;
}

export default function P09Settings() {
  registerP09Locales();
  const { t } = useTranslation('p09');
  useEffect(() => {
    // 强制在子组件首次 render 之前注册(防止 useEffect 时序竞争)
  }, []);

  const { prefs, loading, saveFailed, setLanguage, resetAll } = useSettings();
  const theme = useThemeStore((s) => s.theme);
  const [resetting, setResetting] = useState(false);

  const initialPath = useMemo(() => prefs.scoopInstallConfig?.scoopDir, [prefs.scoopInstallConfig]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetAll();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={t('p09.page.title')}
        description={t('p09.page.subtitle')}
        right={
          <Badge variant="outline" className="border-border bg-bg-overlay/70 text-fg-muted">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary glow-primary" />
            scoop:prefs:set ready
          </Badge>
        }
      />
      <section className="relative z-10 flex-1 overflow-auto px-8 pb-24 pt-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-grid opacity-90" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-glow-top" aria-hidden />
        <div className="relative mx-auto max-w-4xl space-y-6">
          <SettingSection
            title={t('p09.section.language')}
            description={t('p09.section.language.desc')}
            channel={t('p09.section.language.channel')}
          >
            <LanguageSwitcher
              value={prefs.uiLanguage}
              onChange={(lang) => void setLanguage(lang)}
              disabled={loading}
            />
          </SettingSection>

          <SettingSection
            title={t('p09.section.theme')}
            description={t('p09.section.theme.desc')}
            right={
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-primary/55 bg-primary/10 px-2.5 text-xs font-bold text-primary">
                {t('p09.section.theme.default')}
              </span>
            }
          >
            <ThemeSelector value={theme} />
          </SettingSection>

          <SettingSection
            title={t('p09.section.path')}
            description={t('p09.section.path.desc')}
          >
            <ScoopPathConfig
              initialPath={initialPath}
              initialVersion={prefs.scoopInstallConfig ? undefined : undefined}
            />
          </SettingSection>

          <SettingSection
            title={t('p09.section.danger')}
            description={t('p09.section.danger.desc')}
          >
            <DangerZone onConfirm={handleReset} busy={resetting} />
          </SettingSection>

          {saveFailed && (
            <div className="text-center text-xs text-fg-subtle">
              UILanguage = {prefs.uiLanguage}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
