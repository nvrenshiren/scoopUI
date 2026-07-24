// 中英双语文案(F13/F14)。仅 zh/en 两套,不引入第三方语言包(项目硬约束)。
// 语言状态本体在 zustand store(store.ts)中,组件订阅 store.lang 触发重渲;
// 这里仅保存当前语言快照供 t()/tf() 同步读取。
import type { Language } from "./types";

type Dict = Record<string, { zh: string; en: string }>;

const dict: Dict = {
  "app.name": { zh: "scoopUI", en: "scoopUI" },

  // ---------------- 导航(P03)
  "nav.installed": { zh: "已装软件", en: "Installed" },
  "nav.browse": { zh: "浏览软件包", en: "Browse" },
  "nav.buckets": { zh: "桶管理", en: "Buckets" },
  "nav.config": { zh: "Scoop 配置", en: "Scoop Config" },
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
    en: "Scoop is not installed on this machine. Review the configuration below and let scoopUI run the official installer for you. An internet connection is required.",
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
  "installed.repoRefreshFailed": { zh: "刷新软件源失败,基于现有数据检查", en: "Repo refresh failed; checking with cached data" },
  "installed.selectAll": { zh: "全选", en: "Select all" },
  "installed.selectedCount": { zh: "已选 {n} 项", en: "{n} selected" },
  "installed.updateSelected": { zh: "更新所选", en: "Update selected" },
  "installed.uninstallSelected": { zh: "卸载所选", en: "Uninstall selected" },
  "installed.batchUpdateTitle": { zh: "批量更新确认", en: "Confirm bulk update" },
  "installed.batchUpdateDesc": {
    zh: "将按顺序更新以下 {n} 个软件包,每个软件包对应一条任务:",
    en: "The following {n} apps will be updated one by one, each as its own task:",
  },
  "installed.batchUninstallTitle": { zh: "批量卸载确认", en: "Confirm bulk uninstall" },
  "installed.batchUninstallDesc": {
    zh: "将按顺序从本机卸载以下 {n} 个软件包,每个软件包对应一条任务:",
    en: "The following {n} apps will be uninstalled from this machine one by one, each as its own task:",
  },

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

  // ---------------- Scoop 配置 P11(F20)
  "config.title": { zh: "Scoop 配置", en: "Scoop Configuration" },
  "config.desc": {
    zh: "管理 Scoop 自身的全部配置项(scoop config);修改即时生效。",
    en: "Manage all of Scoop's own settings (scoop config). Changes apply immediately.",
  },
  "config.loadFailed": { zh: "配置读取失败", en: "Failed to read configuration" },
  "config.notSet": { zh: "未设置", en: "Not set" },
  "config.reset": { zh: "恢复默认", en: "Reset to default" },
  "config.toggleShow": { zh: "显示/隐藏", en: "Show / hide" },
  "config.saveFailed": { zh: "保存失败:{msg}", en: "Save failed: {msg}" },
  "config.dangerBadge": { zh: "谨慎", en: "Caution" },
  "config.dangerTitle": { zh: "修改目录配置", en: "Change directory setting" },
  "config.dangerDesc": {
    zh: "{name} 只会修改 Scoop 配置,不会搬移已安装的软件包或缓存。改错可能导致 Scoop 找不到已装应用。确定继续吗?",
    en: "{name} only changes Scoop's configuration — it does NOT move already-installed apps or cache. A wrong value may make Scoop lose track of installed apps. Continue?",
  },
  "config.dangerConfirm": { zh: "仍然修改", en: "Change anyway" },

  // 分类
  "config.cat.download.title": { zh: "下载器", en: "Downloader" },
  "config.cat.download.desc": {
    zh: "启用 aria2 可多线程加速下载;以下为其连接与重试参数。",
    en: "aria2 enables multi-connection download acceleration; the options below tune it.",
  },
  "config.cat.network.title": { zh: "网络与代理", en: "Network & Proxy" },
  "config.cat.network.desc": {
    zh: "代理服务器与需要认证的私有主机。",
    en: "Proxy server and authenticated private hosts.",
  },
  "config.cat.update.title": { zh: "更新策略", en: "Update" },
  "config.cat.update.desc": {
    zh: "Scoop 自身与软件包的更新来源和行为。",
    en: "Where and how Scoop and apps update.",
  },
  "config.cat.tools.title": { zh: "安装与工具", en: "Install & Tools" },
  "config.cat.tools.desc": {
    zh: "安装行为、架构、解压与 shim 等底层选项。",
    en: "Install behavior, architecture, extraction and shim options.",
  },
  "config.cat.paths.title": { zh: "目录", en: "Directories" },
  "config.cat.paths.desc": {
    zh: "Scoop 根目录、全局目录与缓存目录。修改仅改配置,不搬移已有数据。",
    en: "Scoop root, global and cache directories. Changing only updates config — it does NOT move existing data.",
  },
  "config.cat.secret.title": { zh: "令牌与密钥", en: "Tokens & Keys" },
  "config.cat.secret.desc": {
    zh: "API 令牌;仅保存在本机 Scoop 配置中。",
    en: "API tokens; stored only in your local Scoop config.",
  },

  // 下载器 aria2
  "config.item.aria2-enabled.label": { zh: "启用 aria2 下载", en: "Enable aria2" },
  "config.item.aria2-enabled.help": {
    zh: "用 aria2c 多线程下载,通常更快;需已安装 aria2。",
    en: "Use aria2c for multi-connection downloads (usually faster); requires aria2 installed.",
  },
  "config.item.aria2-warning-enabled.label": { zh: "显示 aria2 警告", en: "aria2 warnings" },
  "config.item.aria2-warning-enabled.help": {
    zh: "下载时是否显示 aria2 相关警告提示。",
    en: "Show aria2-related warnings during downloads.",
  },
  "config.item.aria2-retry-wait.label": { zh: "重试等待(秒)", en: "Retry wait (s)" },
  "config.item.aria2-retry-wait.help": {
    zh: "两次下载重试之间的等待秒数,默认 2。",
    en: "Seconds to wait between download retries. Default 2.",
  },
  "config.item.aria2-split.label": { zh: "分段数(split)", en: "Split" },
  "config.item.aria2-split.help": {
    zh: "单个文件的并行下载分段数,默认 5。",
    en: "Number of parallel connections per download. Default 5.",
  },
  "config.item.aria2-max-connection-per-server.label": { zh: "每服务器最大连接数", en: "Max connections/server" },
  "config.item.aria2-max-connection-per-server.help": {
    zh: "对同一服务器的最大连接数,默认 5。",
    en: "Maximum connections to one server. Default 5.",
  },
  "config.item.aria2-min-split-size.label": { zh: "最小分段大小", en: "Min split size" },
  "config.item.aria2-min-split-size.help": {
    zh: "触发多连接分段的最小文件大小,如 5M。",
    en: "Minimum file size before splitting into multiple connections, e.g. 5M.",
  },
  "config.item.aria2-options.label": { zh: "额外 aria2 参数", en: "Extra aria2 options" },
  "config.item.aria2-options.help": {
    zh: "追加到 aria2c 的命令行参数,如 --max-tries=5。",
    en: "Extra command-line arguments passed to aria2c, e.g. --max-tries=5.",
  },

  // 网络与代理
  "config.item.proxy.label": { zh: "代理服务器", en: "Proxy" },
  "config.item.proxy.help": {
    zh: "格式 host:port 或 user:pass@host:port;也可用 currentuser@default 走系统代理。",
    en: "Format host:port or user:pass@host:port; or currentuser@default to use the system proxy.",
  },
  "config.item.private_hosts.label": { zh: "私有主机", en: "Private hosts" },
  "config.item.private_hosts.help": {
    zh: "需额外认证头的私有主机(对象数组);请用命令行 scoop config 编辑。",
    en: "Private hosts needing extra auth headers (array of objects); edit via the scoop config command line.",
  },

  // 更新策略
  "config.item.scoop_repo.label": { zh: "Scoop 仓库", en: "Scoop repo" },
  "config.item.scoop_repo.help": {
    zh: "Scoop 自身源码仓库地址;用于自定义 fork。",
    en: "Git repository of Scoop's own source; for custom forks.",
  },
  "config.item.scoop_branch.label": { zh: "Scoop 分支", en: "Scoop branch" },
  "config.item.scoop_branch.help": {
    zh: "接收更新的分支:master 稳定,develop 测试新特性。",
    en: "Branch to update from: master (stable) or develop (testing).",
  },
  "config.item.force_update.label": { zh: "强制更新", en: "Force update" },
  "config.item.force_update.help": {
    zh: "即使版本相同也强制更新到桶内版本。",
    en: "Force apps to update to the bucket version even if unchanged.",
  },
  "config.item.update_nightly.label": { zh: "每日更新 nightly", en: "Update nightly" },
  "config.item.update_nightly.help": {
    zh: "对 nightly 版本每日自动更新。",
    en: "Update nightly-versioned apps once per day.",
  },
  "config.item.hold_update_until.label": { zh: "暂停自更新至", en: "Hold updates until" },
  "config.item.hold_update_until.help": {
    zh: "在该日期(YYYY-MM-DD)前暂停 Scoop 自更新。",
    en: "Postpone Scoop self-update until this date (YYYY-MM-DD).",
  },
  "config.item.autostash_on_conflict.label": { zh: "冲突时自动暂存", en: "Autostash on conflict" },
  "config.item.autostash_on_conflict.help": {
    zh: "更新遇到未提交改动时自动 stash 后再更新。",
    en: "Auto-stash uncommitted changes during update conflicts.",
  },
  "config.item.show_update_log.label": { zh: "显示更新日志", en: "Show update log" },
  "config.item.show_update_log.help": {
    zh: "更新时显示变更的提交记录,默认开启。",
    en: "Show changed commits during updates. On by default.",
  },

  // 安装与工具
  "config.item.default_architecture.label": { zh: "默认架构", en: "Default architecture" },
  "config.item.default_architecture.help": {
    zh: "安装软件包时优先使用的架构。",
    en: "Preferred architecture when installing apps.",
  },
  "config.item.use_external_7zip.label": { zh: "使用外部 7-Zip", en: "External 7-Zip" },
  "config.item.use_external_7zip.help": {
    zh: "用 PATH 中的 7-Zip 解压,而非 Scoop 内置。",
    en: "Use 7-Zip from PATH for extraction instead of the bundled one.",
  },
  "config.item.use_lessmsi.label": { zh: "使用 lessmsi", en: "Use lessmsi" },
  "config.item.use_lessmsi.help": {
    zh: "用 lessmsi 处理 MSI,而非系统 msiexec。",
    en: "Prefer lessmsi over the native msiexec for MSI files.",
  },
  "config.item.use_sqlite_cache.label": { zh: "SQLite 缓存", en: "SQLite cache" },
  "config.item.use_sqlite_cache.help": {
    zh: "用 SQLite 数据库加速搜索与 shim。",
    en: "Use a SQLite database to speed up search and shim.",
  },
  "config.item.no_junction.label": { zh: "禁用 current 联结", en: "No junction" },
  "config.item.no_junction.help": {
    zh: "不使用 current 版本别名(junction)。",
    en: "Do not use the 'current' version alias (junction).",
  },
  "config.item.shim.label": { zh: "Shim 实现", en: "Shim" },
  "config.item.shim.help": {
    zh: "生成可执行入口的 shim 实现。",
    en: "Which shim implementation to generate executables with.",
  },
  "config.item.ignore_running_processes.label": { zh: "忽略运行中的进程", en: "Ignore running processes" },
  "config.item.ignore_running_processes.help": {
    zh: "目标进程正在运行时仍继续操作。",
    en: "Continue even if the target's processes are running.",
  },
  "config.item.show_manifest.label": { zh: "安装前显示清单", en: "Show manifest" },
  "config.item.show_manifest.help": {
    zh: "安装前展示软件包的 manifest。",
    en: "Show the app manifest before installing.",
  },
  "config.item.use_isolated_path.label": { zh: "隔离 PATH", en: "Isolated PATH" },
  "config.item.use_isolated_path.help": {
    zh: "用 SCOOP_PATH 环境变量隔离软件包 PATH。",
    en: "Isolate app PATHs via the SCOOP_PATH environment variable.",
  },
  "config.item.cat_style.label": { zh: "cat 高亮风格", en: "cat style" },
  "config.item.cat_style.help": {
    zh: "用 bat 查看 manifest 时的高亮风格。",
    en: "Highlight style used by bat when viewing manifests.",
  },
  "config.item.debug.label": { zh: "调试输出", en: "Debug" },
  "config.item.debug.help": {
    zh: "输出详细诊断信息。",
    en: "Enable verbose diagnostic output.",
  },

  // 目录(危险)
  "config.item.root_path.label": { zh: "Scoop 根目录", en: "Scoop root" },
  "config.item.root_path.help": {
    zh: "Scoop 本体与软件包位置;仅改配置,不搬移已装数据。",
    en: "Location of Scoop and its apps; changes config only, does not move installed data.",
  },
  "config.item.global_path.label": { zh: "全局目录", en: "Global directory" },
  "config.item.global_path.help": {
    zh: "以 --global 安装的软件包位置。",
    en: "Location for apps installed with --global.",
  },
  "config.item.cache_path.label": { zh: "缓存目录", en: "Cache directory" },
  "config.item.cache_path.help": {
    zh: "安装包下载缓存位置。",
    en: "Download cache location.",
  },

  // 令牌与密钥
  "config.item.gh_token.label": { zh: "GitHub 令牌", en: "GitHub token" },
  "config.item.gh_token.help": {
    zh: "GitHub API 令牌,用于提升访问速率;仅存本机。",
    en: "GitHub API token to raise rate limits; stored locally only.",
  },
  "config.item.virustotal_api_key.label": { zh: "VirusTotal 密钥", en: "VirusTotal key" },
  "config.item.virustotal_api_key.help": {
    zh: "VirusTotal 扫描用 API 密钥;仅存本机。",
    en: "API key for VirusTotal scanning; stored locally only.",
  },

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
