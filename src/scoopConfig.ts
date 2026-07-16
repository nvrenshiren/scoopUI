// scoop config 全部可视化配置项的 schema(F20)。纯数据,不依赖 React/i18n。
// - key:scoop config 的键,写回 CLI 用(scoop config <key> <value> / rm)
// - control:控件类型;label/help 文案走 i18n(config.item.<key>.label / .help)
// - options:enum 可选值;def:默认值(bool/enum 未显式设置时的展示态,string 作 placeholder)
// - danger:危险项(路径类),即时写入前需二次确认
// 分类标题/说明走 i18n(config.cat.<id>.title / .desc);图标在 ConfigView 内映射。

export type ConfigControl = "bool" | "enum" | "number" | "string" | "secret" | "readonly";

export interface ConfigItem {
  key: string;
  control: ConfigControl;
  options?: readonly string[];
  def?: boolean | number | string;
  danger?: boolean;
}

export interface ConfigCategory {
  id: string;
  items: readonly ConfigItem[];
}

export const CONFIG_CATEGORIES: readonly ConfigCategory[] = [
  {
    id: "download",
    items: [
      { key: "aria2-enabled", control: "bool", def: false },
      { key: "aria2-warning-enabled", control: "bool", def: true },
      { key: "aria2-retry-wait", control: "number", def: 2 },
      { key: "aria2-split", control: "number", def: 5 },
      { key: "aria2-max-connection-per-server", control: "number", def: 5 },
      { key: "aria2-min-split-size", control: "string", def: "5M" },
      { key: "aria2-options", control: "string", def: "" },
    ],
  },
  {
    id: "network",
    items: [
      { key: "proxy", control: "string", def: "" },
      { key: "private_hosts", control: "readonly" },
    ],
  },
  {
    id: "update",
    items: [
      { key: "scoop_repo", control: "string", def: "https://github.com/ScoopInstaller/Scoop" },
      { key: "scoop_branch", control: "enum", options: ["master", "develop"], def: "master" },
      { key: "force_update", control: "bool", def: false },
      { key: "update_nightly", control: "bool", def: false },
      { key: "hold_update_until", control: "string", def: "" },
      { key: "autostash_on_conflict", control: "bool", def: false },
      { key: "show_update_log", control: "bool", def: true },
    ],
  },
  {
    id: "tools",
    items: [
      { key: "default_architecture", control: "enum", options: ["64bit", "32bit", "arm64"], def: "64bit" },
      { key: "use_external_7zip", control: "bool", def: false },
      { key: "use_lessmsi", control: "bool", def: false },
      { key: "use_sqlite_cache", control: "bool", def: false },
      { key: "no_junction", control: "bool", def: false },
      { key: "shim", control: "enum", options: ["kiennq", "scoopcs", "71"], def: "kiennq" },
      { key: "ignore_running_processes", control: "bool", def: false },
      { key: "show_manifest", control: "bool", def: false },
      { key: "use_isolated_path", control: "bool", def: false },
      { key: "cat_style", control: "string", def: "" },
      { key: "debug", control: "bool", def: false },
    ],
  },
  {
    id: "paths",
    items: [
      { key: "root_path", control: "string", def: "%USERPROFILE%\\scoop", danger: true },
      { key: "global_path", control: "string", def: "%ProgramData%\\scoop", danger: true },
      { key: "cache_path", control: "string", def: "", danger: true },
    ],
  },
  {
    id: "secret",
    items: [
      { key: "gh_token", control: "secret", def: "" },
      { key: "virustotal_api_key", control: "secret", def: "" },
    ],
  },
];

/** 全部配置项扁平列表(便于按 key 查找)。 */
export const CONFIG_ITEMS: readonly ConfigItem[] = CONFIG_CATEGORIES.flatMap((c) => c.items);
