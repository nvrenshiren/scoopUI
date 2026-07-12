// 中英双语文案(F13/F14)。仅 zh/en 两套,不引入第三方语言包(项目硬约束)。
// 语言状态本体在 zustand store(store.ts)中,组件订阅 store.lang 触发重渲;
// 这里仅保存当前语言快照供 t()/tf() 同步读取。
import type { Language } from "./types";

type Dict = Record<string, { zh: string; en: string }>;

const dict: Dict = {
  "app.name": { zh: "Scoop GUI", en: "Scoop GUI" },

  // ---------------- 导航(P03)
  "nav.installed": { zh: "已装软件", en: "Installed" },
  "nav.browse": { zh: "浏览软件包", en: "Browse" },
  "nav.buckets": { zh: "桶管理", en: "Buckets" },
  "nav.settings": { zh: "设置", en: "Settings" },
  "nav.jobs": { zh: "任务", en: "Jobs" },

  // ---------------- 通用
  "common.refresh": { zh: "刷新", en: "Refresh" },
  "common.search": { zh: "搜索", en: "Search" },
  "common.install": { zh: "安装", en: "Install" },
  "common.uninstall": { zh: "卸载", en: "Uninstall" },
  "common.update": { zh: "更新", en: "Update" },
  "common.cancel": { zh: "取消", en: "Cancel" },
  "common.close": { zh: "关闭", en: "Close" },
  "common.confirm": { zh: "确认", en: "Confirm" },
  "common.retry": { zh: "重试", en: "Retry" },
  "common.details": { zh: "详情", en: "Details" },
  "common.add": { zh: "添加", en: "Add" },
  "common.remove": { zh: "移除", en: "Remove" },
  "common.loading": { zh: "加载中…", en: "Loading…" },
  "common.actions": { zh: "操作", en: "Actions" },
  "common.name": { zh: "名称", en: "Name" },
  "common.version": { zh: "版本", en: "Version" },
  "common.source": { zh: "来源桶", en: "Bucket" },
  "common.updated": { zh: "更新时间", en: "Updated" },
  "common.status": { zh: "状态", en: "Status" },
  "common.optional": { zh: "(可选)", en: "(optional)" },
  "common.copy": { zh: "复制", en: "Copy" },
  "common.copied": { zh: "已复制", en: "Copied" },

  // ---------------- 启动 / P01 / P02
  "boot.starting": { zh: "正在启动…", en: "Starting…" },
  "boot.detecting": { zh: "正在检测本机 Scoop…", en: "Detecting Scoop on this machine…" },
  "boot.detectHint": {
    zh: "正在执行 scoop --version 检查命令可用性",
    en: "Running scoop --version to check availability",
  },
  "setup.notFoundTitle": { zh: "未检测到 Scoop", en: "Scoop Not Detected" },
  "setup.notFoundDesc": {
    zh: "本机尚未安装 Scoop 包管理器。你可以在下方确认安装配置后,由本产品协助完成首次安装;安装过程需要网络连接。",
    en: "Scoop is not installed on this machine. Review the configuration below and let Scoop GUI run the official installer for you. An internet connection is required.",
  },
  "setup.formTitle": { zh: "安装配置", en: "Installation Options" },
  "setup.formDesc": {
    zh: "以下配置项与 Scoop 官方安装脚本 install.ps1 一一对应;留空即使用官方默认值。确认后开始安装,安装过程中不可修改;本次配置将保存在本机,重装时可复用。",
    en: "These options map 1:1 to the official install.ps1 parameters; leave blank to use the defaults. Once confirmed the installer starts and options are locked. Your choices are saved locally for future reinstalls.",
  },
  "setup.scoopDir": { zh: "安装根目录 (ScoopDir)", en: "Install directory (ScoopDir)" },
  "setup.scoopDirHelp": {
    zh: "Scoop 本体与所有软件包的安装位置,默认 %USERPROFILE%\\scoop",
    en: "Where Scoop itself and all packages are installed. Default: %USERPROFILE%\\scoop",
  },
  "setup.globalDir": { zh: "全局软件包目录 (ScoopGlobalDir)", en: "Global apps directory (ScoopGlobalDir)" },
  "setup.globalDirHelp": {
    zh: "使用 --global 安装的软件包存放位置,默认 C:\\ProgramData\\scoop。修改此项需要管理员权限。",
    en: "Location for apps installed with --global. Default: C:\\ProgramData\\scoop. Changing this requires administrator rights.",
  },
  "setup.cacheDir": { zh: "下载缓存目录 (ScoopCacheDir)", en: "Download cache (ScoopCacheDir)" },
  "setup.cacheDirHelp": {
    zh: "安装包下载缓存位置,默认位于安装根目录内的 cache 子目录",
    en: "Where downloaded installers are cached. Default: the cache folder inside ScoopDir.",
  },
  "setup.proxy": { zh: "代理服务器 (Proxy)", en: "Proxy (Proxy)" },
  "setup.proxyHelp": {
    zh: "通过指定代理下载,例如 http://127.0.0.1:7890;留空则不使用代理",
    en: "Download via the given proxy, e.g. http://127.0.0.1:7890. Leave blank for direct connection.",
  },
  "setup.noProxy": { zh: "代理例外 (NoProxy)", en: "Proxy bypass (NoProxy)" },
  "setup.noProxyHelp": {
    zh: "不走代理的主机列表,逗号分隔",
    en: "Comma-separated list of hosts that bypass the proxy.",
  },
  "setup.proxyUser": { zh: "代理用户名 (ProxyCredential)", en: "Proxy username (ProxyCredential)" },
  "setup.proxyPass": { zh: "代理密码", en: "Proxy password" },
  "setup.proxyCredHelp": {
    zh: "代理需要身份验证时填写;留空则不使用凭据",
    en: "Fill in only if your proxy requires authentication.",
  },
  "setup.useDefaultCred": {
    zh: "使用 Windows 默认凭据访问代理 (ProxyUseDefaultCredentials)",
    en: "Use Windows default credentials for the proxy (ProxyUseDefaultCredentials)",
  },
  "setup.runAsAdmin": { zh: "以管理员权限运行安装 (RunAsAdmin)", en: "Run installer as administrator (RunAsAdmin)" },
  "setup.runAsAdminHelp": {
    zh: "勾选后将弹出 UAC 提权窗口执行安装;需要设置全局软件包目录等场景时使用。不勾选则以当前用户身份安装(推荐)。",
    en: "Shows a UAC prompt and runs the installer elevated — needed e.g. for a custom global directory. Leave unchecked to install as the current user (recommended).",
  },
  "setup.startInstall": { zh: "开始安装 Scoop", en: "Install Scoop" },
  "setup.installing": { zh: "正在安装 Scoop…", en: "Installing Scoop…" },
  "setup.installingDesc": {
    zh: "正在执行官方安装脚本,请保持网络连接。以下为实时输出:",
    en: "Running the official installer. Keep your network connected. Live output:",
  },
  "setup.succeeded": { zh: "Scoop 安装成功,正在进入主界面…", en: "Scoop installed successfully. Entering the app…" },
  "setup.failedTitle": { zh: "安装失败", en: "Installation Failed" },
  "setup.failedDesc": {
    zh: "安装未能完成。你可以检查网络与配置后重试;下方日志给出了失败原因。",
    en: "The installer did not finish. Check your network and options, then retry. The log below shows the reason.",
  },
  "setup.cancelledDesc": { zh: "安装已取消。", en: "Installation was cancelled." },
  "setup.recheckFailed": {
    zh: "安装脚本执行完毕,但复检未发现可用的 scoop 命令。",
    en: "Installer finished but scoop is still not available on re-check.",
  },
  "setup.adminBadge": { zh: "需要管理员权限", en: "Requires administrator" },
  "setup.err.summary": { zh: "请检查下方标红的配置项", en: "Please check the highlighted fields below" },
  "setup.err.invalidPath": {
    zh: "路径中含有非法字符(不允许 \" < > | ? *)",
    en: "Path contains invalid characters (\" < > | ? * are not allowed)",
  },
  "setup.err.invalidProxy": {
    zh: "代理地址格式应为 http(s)://主机:端口",
    en: "Proxy must look like http(s)://host:port",
  },
  "setup.err.credConflict": {
    zh: "已勾选使用默认凭据,不能同时填写代理用户名/密码",
    en: "Can't set a proxy username/password while using default credentials",
  },
  "setup.err.credIncomplete": {
    zh: "代理用户名与密码需同时填写",
    en: "Proxy username and password must be filled in together",
  },

  // ---------------- 已装列表 P04
  "installed.title": { zh: "已装软件包", en: "Installed Apps" },
  "installed.desc": {
    zh: "本机已通过 Scoop 安装的软件包;存在新版本的软件包会标记为“过期”。",
    en: "Apps installed via Scoop on this machine. Apps with a newer version available are marked as outdated.",
  },
  "installed.checkUpdates": { zh: "检查更新", en: "Check updates" },
  "installed.updateAll": { zh: "更新全部过期", en: "Update all outdated" },
  "installed.outdated": { zh: "过期", en: "Outdated" },
  "installed.upToDate": { zh: "最新", en: "Up to date" },
  "installed.latest": { zh: "可用版本", en: "Latest" },
  "installed.empty": { zh: "本机还没有通过 Scoop 安装任何软件包", en: "No apps installed via Scoop yet" },
  "installed.emptyHint": {
    zh: "前往“浏览软件包”查找并安装第一个软件包",
    en: "Head to Browse to find and install your first package",
  },
  "installed.filter": { zh: "过滤已装软件包…", en: "Filter installed apps…" },
  "installed.updateAllTitle": { zh: "批量更新确认", en: "Confirm bulk update" },
  "installed.updateAllDesc": {
    zh: "将按顺序更新以下 {n} 个过期软件包,每个软件包对应一条任务:",
    en: "The following {n} outdated apps will be updated one by one, each as its own task:",
  },
  "installed.noMatch": { zh: "没有匹配的已装软件包", en: "No installed apps match your filter" },
  "installed.noMatchHint": { zh: "换个关键字,或清空过滤条件", en: "Try another keyword, or clear the filter" },
  "installed.updateTitle": { zh: "更新确认", en: "Confirm update" },
  "installed.updateDesc": {
    zh: "确定要将 {name} 更新到最新版本吗?",
    en: "Update {name} to the latest version?",
  },
  "installed.uninstallTitle": { zh: "卸载确认", en: "Confirm uninstall" },
  "installed.uninstallDesc": {
    zh: "确定要从本机卸载 {name} 吗?",
    en: "Really uninstall {name} from this machine?",
  },
  "installed.statusFailed": { zh: "过期检查失败", en: "Update check failed" },

  // ---------------- 浏览/搜索 P05
  "browse.title": { zh: "浏览软件包", en: "Browse Packages" },
  "browse.desc": {
    zh: "已添加桶中的可安装软件包;数据来源于本机 Scoop,不联网发现新软件源。",
    en: "Installable packages from your added buckets. Data comes from local Scoop only.",
  },
  "browse.searchPlaceholder": { zh: "按名称搜索软件包…", en: "Search packages by name…" },
  "browse.loadingAll": {
    zh: "正在读取全部可装软件包(首次较慢,取决于桶大小)…",
    en: "Loading all installable packages (first load may take a while)…",
  },
  "browse.installedBadge": { zh: "已安装", en: "Installed" },
  "browse.empty": { zh: "没有匹配的软件包", en: "No matching packages" },
  "browse.emptyHint": { zh: "换个关键字,或到“桶管理”添加更多桶", en: "Try another keyword, or add more buckets" },
  "browse.showing": { zh: "显示 {shown} / {total} 条", en: "Showing {shown} of {total}" },
  "browse.narrowHint": { zh: "输入关键字缩小范围", en: "Type to narrow down the list" },
  "browse.loadFailed": { zh: "可装软件包列表读取失败", en: "Failed to load package list" },

  // ---------------- 桶管理 P06
  "buckets.title": { zh: "桶管理", en: "Buckets" },
  "buckets.desc": {
    zh: "桶是软件包的来源仓库。这里管理本机已添加的桶,并可从 Scoop 已知桶清单中添加新桶。",
    en: "Buckets are package source repositories. Manage the buckets added on this machine and add new ones from the known list.",
  },
  "buckets.addedTab": { zh: "已添加", en: "Added" },
  "buckets.knownTab": { zh: "已知桶清单", en: "Known buckets" },
  "buckets.manifests": { zh: "软件包数", en: "Manifests" },
  "buckets.addBucket": { zh: "添加桶", en: "Add bucket" },
  "buckets.addCustom": { zh: "添加自定义桶", en: "Add custom bucket" },
  "buckets.bucketName": { zh: "桶名称", en: "Bucket name" },
  "buckets.repoUrl": { zh: "仓库地址", en: "Repository URL" },
  "buckets.repoHelp": {
    zh: "已知桶无需填写;自定义桶需提供 git 仓库地址",
    en: "Not needed for known buckets; custom buckets require a git repository URL.",
  },
  "buckets.removeTitle": { zh: "移除桶确认", en: "Confirm bucket removal" },
  "buckets.removeDesc": {
    zh: "移除桶 {name} 后,该桶内未安装的软件包将不再出现在浏览列表;已安装的软件包不受影响。",
    en: "After removing {name}, its uninstalled packages disappear from Browse. Already installed apps are not affected.",
  },
  "buckets.alreadyAdded": { zh: "已添加", en: "Added" },
  "buckets.empty": { zh: "本机还没有添加任何桶", en: "No buckets added yet" },
  "buckets.knownEmpty": { zh: "Scoop 未提供可添加的已知桶", en: "Scoop reports no known buckets to add" },
  "buckets.knownLoadFailed": { zh: "已知桶清单读取失败", en: "Failed to load the known bucket list" },
  "buckets.loadFailed": { zh: "桶列表读取失败", en: "Failed to load buckets" },

  // ---------------- 详情 P07
  "detail.title": { zh: "软件包详情", en: "Package Details" },
  "detail.loading": { zh: "正在读取详情…", en: "Loading details…" },
  "detail.failed": { zh: "详情读取失败", en: "Failed to load details" },
  // scoop info 字段名映射(值为 CLI 数据,原样展示;未知字段名回退英文原文)
  "detail.field.Name": { zh: "名称", en: "Name" },
  "detail.field.Description": { zh: "描述", en: "Description" },
  "detail.field.Version": { zh: "版本", en: "Version" },
  "detail.field.Source": { zh: "来源桶", en: "Source" },
  "detail.field.Bucket": { zh: "来源桶", en: "Bucket" },
  "detail.field.Website": { zh: "官方网站", en: "Website" },
  "detail.field.License": { zh: "许可证", en: "License" },
  "detail.field.Updated at": { zh: "更新时间", en: "Updated at" },
  "detail.field.Updated by": { zh: "更新者", en: "Updated by" },
  "detail.field.Installed": { zh: "已装版本", en: "Installed" },
  "detail.field.Binaries": { zh: "可执行文件", en: "Binaries" },
  "detail.field.Shortcuts": { zh: "快捷方式", en: "Shortcuts" },
  "detail.field.Notes": { zh: "备注", en: "Notes" },
  "detail.field.Dependencies": { zh: "依赖", en: "Dependencies" },
  "detail.field.Suggestions": { zh: "建议安装", en: "Suggestions" },
  "detail.field.Environment": { zh: "环境变量", en: "Environment" },
  "detail.field.Path Added": { zh: "加入 PATH", en: "Path Added" },
  "detail.field.Includes": { zh: "包含", en: "Includes" },
  "detail.field.Persist": { zh: "持久化数据", en: "Persist" },
  "detail.field.Manifest": { zh: "清单文件", en: "Manifest" },

  // ---------------- 任务 P08
  "jobs.title": { zh: "任务进度", en: "Tasks" },
  "jobs.state.queued": { zh: "排队中", en: "Queued" },
  "jobs.state.running": { zh: "执行中", en: "Running" },
  "jobs.state.succeeded": { zh: "已成功", en: "Succeeded" },
  "jobs.state.failed": { zh: "已失败(可重试)", en: "Failed (retryable)" },
  "jobs.state.cancelled": { zh: "已取消", en: "Cancelled" },
  "jobs.kind.install": { zh: "安装", en: "Install" },
  "jobs.kind.uninstall": { zh: "卸载", en: "Uninstall" },
  "jobs.kind.update": { zh: "更新", en: "Update" },
  "jobs.kind.bucket-add": { zh: "添加桶", en: "Add bucket" },
  "jobs.kind.bucket-remove": { zh: "移除桶", en: "Remove bucket" },
  "jobs.kind.install-scoop": { zh: "安装 Scoop", en: "Install Scoop" },
  "jobs.empty": { zh: "暂无任务", en: "No tasks yet" },
  "jobs.log": { zh: "任务日志", en: "Task log" },
  "jobs.cancelJob": { zh: "取消任务", en: "Cancel task" },
  "jobs.succeededToast": { zh: "{title} 已成功", en: "{title} succeeded" },
  "jobs.failedToast": { zh: "{title} 失败,可在任务面板查看日志后重试", en: "{title} failed — check the log in the task panel and retry" },
  "jobs.cancelledToast": { zh: "{title} 已取消", en: "{title} cancelled" },

  // ---------------- 设置 P09
  "settings.title": { zh: "设置", en: "Settings" },
  "settings.desc": { zh: "界面语言与外观", en: "Language and appearance" },
  "settings.language": { zh: "界面语言", en: "Language" },
  "settings.languageDesc": { zh: "切换后立即生效,并保存在本机", en: "Takes effect immediately and is saved on this machine" },
  "settings.theme": { zh: "主题", en: "Theme" },
  "settings.theme.dark": { zh: "暗色", en: "Dark" },
  "settings.theme.light": { zh: "亮色", en: "Light" },
  "settings.theme.system": { zh: "跟随系统", en: "System" },
  "settings.about": { zh: "关于", en: "About" },
  "settings.scoopVersion": { zh: "Scoop 版本", en: "Scoop version" },
  "settings.appVersion": { zh: "应用版本", en: "App version" },
  "settings.persistFailed": {
    zh: "设置已生效,但保存到本机失败;下次启动可能恢复旧值",
    en: "Applied, but saving failed — the old value may return on next launch",
  },
  "settings.installConfig": { zh: "上次确认的 Scoop 安装配置", en: "Last confirmed Scoop install options" },
  "settings.installConfigDesc": {
    zh: "协助安装 Scoop 时确认过的配置,重装时自动带入",
    en: "Options confirmed during assisted install; pre-filled on reinstall",
  },
  "settings.notConfigured": { zh: "尚未通过本产品安装过 Scoop", en: "Scoop has not been installed through this app" },

  // ---------------- 错误 / 空态 P10
  "error.readFailed": { zh: "无法读取数据", en: "Failed to read data" },
  "error.scoopUnavailable": {
    zh: "本机 Scoop 当前不可用,相关数据无法读取。请检查 scoop 命令是否正常后刷新重试。",
    en: "Scoop is currently unavailable on this machine. Check that the scoop command works, then refresh.",
  },
  "error.jobStartFailed": { zh: "任务创建失败:{msg}", en: "Failed to start task: {msg}" },
};

let currentLang: Language = "zh";

/** 仅由 store 调用;组件重渲由 store.lang 订阅驱动 */
export function setLang(lang: Language) {
  currentLang = lang;
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
}

export function t(key: string, params?: Record<string, string | number>): string {
  const entry = dict[key];
  let text = entry ? entry[currentLang] : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

/** 带回退的翻译:字典缺失时返回 fallback(用于 CLI 动态字段名等) */
export function tf(key: string, fallback: string): string {
  const entry = dict[key];
  return entry ? entry[currentLang] : fallback;
}
