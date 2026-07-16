// P11 · Scoop 配置页(F20)。可视化 scoop config 支持的全部配置项,改一项即时写入。
// - bool→Switch;enum→Button 段选;number/string/secret→Input(失焦或回车提交);
//   readonly(private_hosts)→只读展示。
// - 危险路径项(root/global/cache_path)提交/恢复前弹 ConfirmDialog 警告。
// - 敏感项(gh_token/virustotal_api_key)默认遮罩、可切换显示,值只在本机读写。
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Download, Eye, EyeOff, Globe, HardDrive, KeyRound, RefreshCw, RotateCcw, Wrench } from "lucide-react";

import { t, tf } from "@/i18n";
import { resetScoopConfigItem, setScoopConfigItem, useApp, useLang } from "@/store";
import { CONFIG_CATEGORIES, type ConfigItem } from "@/scoopConfig";
import type { ScoopConfigMap } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const CAT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  download: Download,
  network: Globe,
  update: RefreshCw,
  tools: Wrench,
  paths: HardDrive,
  secret: KeyRound,
};

type Pending =
  | { item: ConfigItem; kind: "set"; value: string }
  | { item: ConfigItem; kind: "reset" };

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
    <section className="mb-3 max-w-[820px] rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-sm font-semibold">{title}</div>
          {desc && <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>}
        </div>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** string / number / secret 输入:草稿态 + 失焦/回车提交;清空即恢复默认(交父处理)。 */
function EditableField({
  item,
  scoopConfig,
  onCommit,
  secret,
  number,
}: {
  item: ConfigItem;
  scoopConfig: ScoopConfigMap;
  onCommit: (item: ConfigItem, value: string) => void;
  secret?: boolean;
  number?: boolean;
}) {
  const cur = scoopConfig[item.key];
  const curStr = cur != null ? String(cur) : "";
  const [draft, setDraft] = useState(curStr);
  const [show, setShow] = useState(false);
  useEffect(() => setDraft(curStr), [curStr]);

  const commit = () => {
    const v = draft.trim();
    if (v === curStr) return;
    onCommit(item, v);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type={secret && !show ? "password" : number ? "number" : "text"}
        value={draft}
        placeholder={item.def != null && item.def !== "" ? String(item.def) : ""}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        spellCheck={false}
        autoComplete={secret ? "off" : undefined}
        className={cn("h-9", number ? "w-28" : "w-64")}
      />
      {secret && (
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          title={t("config.toggleShow")}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
      )}
    </div>
  );
}

function Control({
  item,
  scoopConfig,
  onCommit,
}: {
  item: ConfigItem;
  scoopConfig: ScoopConfigMap;
  onCommit: (item: ConfigItem, value: string) => void;
}) {
  const cur = scoopConfig[item.key];
  switch (item.control) {
    case "bool": {
      const checked = item.key in scoopConfig ? cur === true : item.def === true;
      return <Switch checked={checked} onCheckedChange={(v) => onCommit(item, v ? "true" : "false")} />;
    }
    case "enum": {
      const curStr = cur != null ? String(cur) : String(item.def ?? "");
      return (
        <div className="flex gap-1.5">
          {item.options?.map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={curStr === opt ? "default" : "outline"}
              onClick={() => onCommit(item, opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      );
    }
    case "readonly":
      return (
        <div
          className="max-w-[260px] truncate font-mono text-xs text-subtle"
          title={cur != null ? JSON.stringify(cur) : ""}
        >
          {cur != null ? JSON.stringify(cur) : t("config.notSet")}
        </div>
      );
    default:
      return (
        <EditableField
          item={item}
          scoopConfig={scoopConfig}
          onCommit={onCommit}
          secret={item.control === "secret"}
          number={item.control === "number"}
        />
      );
  }
}

function ConfigRow({
  item,
  scoopConfig,
  onCommit,
  onReset,
}: {
  item: ConfigItem;
  scoopConfig: ScoopConfigMap;
  onCommit: (item: ConfigItem, value: string) => void;
  onReset: (item: ConfigItem) => void;
}) {
  const isSet = item.key in scoopConfig;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-medium">
          <span>{t(`config.item.${item.key}.label`)}</span>
          {item.danger && <Badge variant="warning">{t("config.dangerBadge")}</Badge>}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{tf(`config.item.${item.key}.help`, "")}</div>
        <div className="mt-1 font-mono text-[10px] text-subtle select-text">{item.key}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <Control item={item} scoopConfig={scoopConfig} onCommit={onCommit} />
        {isSet && item.control !== "readonly" && (
          <Button variant="ghost" size="iconSm" title={t("config.reset")} onClick={() => onReset(item)}>
            <RotateCcw className="size-3.5 text-subtle" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ConfigView() {
  useLang();
  const scoopConfig = useApp((s) => s.scoopConfig);
  const loading = useApp((s) => s.loading.config);
  const error = useApp((s) => s.errors.config);
  const [pending, setPending] = useState<Pending | null>(null);

  const commit = (item: ConfigItem, value: string) => {
    if (value === "") {
      reset(item); // 清空 → 恢复默认
      return;
    }
    if (item.danger) setPending({ item, kind: "set", value });
    else void setScoopConfigItem(item.key, value);
  };
  const reset = (item: ConfigItem) => {
    if (item.danger) setPending({ item, kind: "reset" });
    else void resetScoopConfigItem(item.key);
  };
  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === "set") void setScoopConfigItem(pending.item.key, pending.value);
    else void resetScoopConfigItem(pending.item.key);
    setPending(null);
  };

  const firstLoad = loading && Object.keys(scoopConfig).length === 0;

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="bg-grid relative px-7 pt-6 pb-4">
        <div className="bg-glow-top pointer-events-none absolute inset-0" />
        <div className="relative">
          <h1 className="text-2xl font-semibold">{t("config.title")}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("config.desc")}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-7 pb-6">
        {error ? (
          <div className="mt-2 max-w-[820px] rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {t("config.loadFailed")}: {error}
          </div>
        ) : firstLoad ? (
          <div className="mt-2 text-sm text-muted-foreground">{t("common.loading")}</div>
        ) : (
          CONFIG_CATEGORIES.map((cat) => {
            const Icon = CAT_ICONS[cat.id] ?? Wrench;
            return (
              <Section
                key={cat.id}
                icon={<Icon className="size-[18px] shrink-0" />}
                title={t(`config.cat.${cat.id}.title`)}
                desc={tf(`config.cat.${cat.id}.desc`, "")}
              >
                {cat.items.map((item) => (
                  <ConfigRow
                    key={item.key}
                    item={item}
                    scoopConfig={scoopConfig}
                    onCommit={commit}
                    onReset={reset}
                  />
                ))}
              </Section>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!pending}
        title={t("config.dangerTitle")}
        message={pending ? t("config.dangerDesc", { name: t(`config.item.${pending.item.key}.label`) }) : ""}
        confirmText={t("config.dangerConfirm")}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
