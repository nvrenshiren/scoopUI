// P09 · 设置页(F14 语言切换 / 主题 / 关于)
import { useMemo, type ReactNode } from "react";
import { Check, Download, Globe, Info, SlidersVertical } from "lucide-react";

import { t } from "@/i18n";
import { switchLanguage, switchTheme, useApp, useLang } from "@/store";
import type { Theme } from "@/types";
import { Button } from "@/components/ui/button";

const THEMES: Theme[] = ["dark", "light", "system"];

function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-3 max-w-[720px] rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-sm font-semibold">{title}</div>
          {desc && <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function SettingsView() {
  useLang();
  const lang = useApp((s) => s.lang);
  const theme = useApp((s) => s.theme);
  const settings = useApp((s) => s.settings);
  const scoopVersion = useApp((s) => s.scoopVersion);

  const installCfgRows = useMemo(() => {
    const cfg = settings?.installConfig;
    if (!cfg) return [] as [string, string][];
    const rows: [string, string][] = [];
    if (cfg.scoopDir) rows.push(["ScoopDir", cfg.scoopDir]);
    if (cfg.scoopGlobalDir) rows.push(["ScoopGlobalDir", cfg.scoopGlobalDir]);
    if (cfg.scoopCacheDir) rows.push(["ScoopCacheDir", cfg.scoopCacheDir]);
    if (cfg.proxy) rows.push(["Proxy", cfg.proxy]);
    if (cfg.noProxy) rows.push(["NoProxy", cfg.noProxy]);
    if (cfg.proxyUseDefaultCredentials) rows.push(["ProxyUseDefaultCredentials", "true"]);
    if (cfg.runAsAdmin) rows.push(["RunAsAdmin", "true"]);
    return rows;
  }, [settings]);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="bg-grid relative px-7 pt-6 pb-4">
        <div className="bg-glow-top pointer-events-none absolute inset-0" />
        <div className="relative">
          <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("settings.desc")}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-7 pb-6">
        {/* 语言(F14:切换立即生效并持久化) */}
        <Section
          icon={<Globe className="size-[18px]" />}
          title={t("settings.language")}
          desc={t("settings.languageDesc")}
        >
          <div className="mt-3.5 flex gap-3">
            <Button variant={lang === "zh" ? "default" : "outline"} onClick={() => void switchLanguage("zh")}>
              {lang === "zh" && <Check className="size-3.5" />}
              中文
            </Button>
            <Button variant={lang === "en" ? "default" : "outline"} onClick={() => void switchLanguage("en")}>
              {lang === "en" && <Check className="size-3.5" />}
              English
            </Button>
          </div>
        </Section>

        {/* 主题(暗色默认;亮/暗/跟随系统三选一) */}
        <Section icon={<SlidersVertical className="size-[18px]" />} title={t("settings.theme")}>
          <div className="mt-3.5 flex gap-3">
            {THEMES.map((th) => (
              <Button
                key={th}
                variant={theme === th ? "default" : "outline"}
                onClick={() => void switchTheme(th)}
              >
                {theme === th && <Check className="size-3.5" />}
                {t("settings.theme." + th)}
              </Button>
            ))}
          </div>
        </Section>

        {/* 上次确认的安装配置(F16 持久化结果,只读展示) */}
        <Section
          icon={<Download className="size-[18px]" />}
          title={t("settings.installConfig")}
          desc={t("settings.installConfigDesc")}
        >
          {installCfgRows.length === 0 ? (
            <div className="mt-3 text-[13px] text-subtle">{t("settings.notConfigured")}</div>
          ) : (
            <dl className="mt-3 grid grid-cols-[240px_1fr] gap-x-4 gap-y-1.5 font-mono text-xs">
              {installCfgRows.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-subtle">{key}</dt>
                  <dd className="m-0 break-all select-text">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Section>

        {/* 关于 */}
        <Section icon={<Info className="size-[18px]" />} title={t("settings.about")}>
          <dl className="mt-3 grid grid-cols-[240px_1fr] gap-x-4 gap-y-1.5 font-mono text-xs">
            <dt className="text-subtle">{t("settings.appVersion")}</dt>
            <dd className="m-0 select-text">Scoop GUI 0.1.0</dd>
            <dt className="text-subtle">{t("settings.scoopVersion")}</dt>
            <dd className="m-0 select-text">{scoopVersion || "—"}</dd>
          </dl>
        </Section>
      </div>
    </div>
  );
}
