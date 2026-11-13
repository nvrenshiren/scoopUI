// P09 · 设置页(F14 语言切换 / 主题 / 关于)
import { useMemo, type ReactNode } from "react";
import { Check, Download, Globe, Info, SlidersVertical } from "lucide-react";

import { t } from "@/i18n";
import { switchLanguage, switchTheme, useApp, useLang } from "@/store";
import type { Theme } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import packageJson from "../../package.json";

const THEMES: Theme[] = ["dark", "light", "system"];

function Section({
  icon,
  title,
  desc,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</span>
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
      <PageHeader icon={SlidersVertical} title={t("settings.title")} description={t("settings.desc")} />

      <div className="min-h-0 flex-1 overflow-auto px-7 pt-4 pb-6">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 语言(F14:切换立即生效并持久化) */}
        <Section
          icon={<Globe className="size-[18px]" />}
          title={t("settings.language")}
          desc={t("settings.languageDesc")}
        >
          <div className="mt-3.5 flex gap-3" role="group" aria-label={t("settings.language")}>
            <Button
              variant={lang === "zh" ? "default" : "outline"}
              aria-pressed={lang === "zh"}
              onClick={() => void switchLanguage("zh")}
            >
              {lang === "zh" && <Check className="size-3.5" />}
              中文
            </Button>
            <Button
              variant={lang === "en" ? "default" : "outline"}
              aria-pressed={lang === "en"}
              onClick={() => void switchLanguage("en")}
            >
              {lang === "en" && <Check className="size-3.5" />}
              English
            </Button>
          </div>
        </Section>

        {/* 主题(暗色默认;亮/暗/跟随系统三选一) */}
        <Section icon={<SlidersVertical className="size-[18px]" />} title={t("settings.theme")}>
          <div className="mt-3.5 flex gap-3" role="group" aria-label={t("settings.theme")}>
            {THEMES.map((th) => (
              <Button
                key={th}
                variant={theme === th ? "default" : "outline"}
                aria-pressed={theme === th}
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
          className="xl:col-span-2"
        >
          {installCfgRows.length === 0 ? (
            <div className="mt-3 text-[13px] text-subtle">{t("settings.notConfigured")}</div>
          ) : (
            <dl className="mt-3 grid grid-cols-[minmax(140px,240px)_1fr] gap-x-4 gap-y-1.5 font-mono text-xs">
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
          <dl className="mt-3 grid grid-cols-[minmax(100px,160px)_1fr] gap-x-4 gap-y-1.5 font-mono text-xs">
            <dt className="text-subtle">{t("settings.appVersion")}</dt>
            <dd className="m-0 select-text">{`scoopUI ${packageJson.version}`}</dd>
            <dt className="text-subtle">{t("settings.scoopVersion")}</dt>
            <dd className="m-0 select-text">{scoopVersion || "—"}</dd>
          </dl>
        </Section>
        </div>
      </div>
    </div>
  );
}
