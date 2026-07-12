export interface P01Copy {
  page: {
    title: string;
    subtitle: string;
    metaDetect: string;
    metaLatency: string;
    metaFields: string;
  };
  common: {
    retry: string;
    cancel: string;
    later: string;
    back: string;
    confirm: string;
    confirmInstall: string;
    confirmInstallAdmin: string;
    enabled: string;
    disabled: string;
    optional: string;
    required: string;
    unavailable: string;
    notConfigured: string;
    checking: string;
    pending: string;
    pass: string;
    fail: string;
    empty: string;
  };
  statusHero: {
    detectingTitle: string;
    detectingSubtitle: string;
    readyTitle: string;
    readySubtitle: string;
    notFoundTitle: string;
    notFoundSubtitle: string;
    errorTitle: string;
    errorSubtitle: string;
    stageDetecting: string;
    stageReady: string;
    stageNotFound: string;
    stageError: string;
    progressLabel: string;
    versionLabel: string;
    pathLabel: string;
    configPreviewTitle: string;
    configPreviewSubtitle: string;
  };
  configOptions: Array<{
    key: string;
    label: string;
    description: string;
    defaultValue: string;
    risk: string;
  }>;
  checklist: {
    title: string;
    subtitle: string;
    foundVersion: string;
    foundPath: string;
    noVersion: string;
    noPath: string;
    items: {
      scoopCommand: { label: string; command: string };
      scoopCore: { label: string; command: string };
      envVars: { label: string; command: string };
      powershell: { label: string; command: string };
      path: { label: string; command: string };
    };
    states: {
      passed: string;
      failed: string;
      pending: string;
      checking: string;
    };
  };
  installGuide: {
    title: string;
    subtitle: string;
    introTitle: string;
    introDesc: string;
    requirementsTitle: string;
    requirements: string[];
    fieldsTitle: string;
    fieldsSubtitle: string;
    pathsSection: string;
    proxySection: string;
    privilegeSection: string;
    adminWarningTitle: string;
    adminWarningDesc: string;
    validationTitle: string;
    noValidationIssues: string;
    confirmNotice: string;
    dialogTitle: string;
    dialogDesc: string;
    dialogConfirm: string;
    dialogCancel: string;
    p08Hint: string;
    fields: {
      scoopDir: { label: string; key: string; hint: string; placeholder: string };
      scoopGlobalDir: { label: string; key: string; hint: string; placeholder: string };
      scoopCacheDir: { label: string; key: string; hint: string; placeholder: string };
      noProxy: { label: string; key: string; hint: string };
      proxy: { label: string; key: string; hint: string; placeholder: string };
      proxyCredentialUsername: { label: string; key: string; placeholder: string };
      proxyCredentialPassword: { label: string; key: string; placeholder: string };
      proxyUseDefaultCredentials: { label: string; key: string; hint: string };
      runAsAdmin: { label: string; key: string; hint: string };
    };
    validation: {
      scoopDirRequired: string;
      invalidPath: string;
      noProxyConflict: string;
      proxyCredentialIncomplete: string;
      defaultCredentialConflict: string;
    };
  };
  emptyState: {
    readyTitle: string;
    readyDesc: string;
    readyAction: string;
    waitingTitle: string;
    waitingDesc: string;
    waitingAction: string;
    errorTitle: string;
    errorDesc: string;
    errorAction: string;
  };
}

export const P01zh: P01Copy = {
  page: {
    title: '启动检测与协助安装',
    subtitle: '首次启动或检测到 Scoop 不可用时,在这里完成安装。',
    metaDetect: 'scoop:onboarding:check',
    metaLatency: '通常 < 200ms',
    metaFields: '8 项安装配置',
  },
  common: {
    retry: '重新检测',
    cancel: '取消',
    later: '稍后再说',
    back: '返回修改',
    confirm: '确认',
    confirmInstall: '确认安装',
    confirmInstallAdmin: '确认安装(管理员)',
    enabled: '已启用',
    disabled: '未启用',
    optional: '可选',
    required: '必填',
    unavailable: '不可用',
    notConfigured: '未配置',
    checking: '检测中',
    pending: '待检测',
    pass: '通过',
    fail: '未通过',
    empty: '空',
  },
  statusHero: {
    detectingTitle: '正在检测 Scoop 是否可用',
    detectingSubtitle: '通过 where scoop 与 scoop --version 探测本机环境,请稍候。',
    readyTitle: '已检测到 Scoop',
    readySubtitle: 'Scoop CLI 可用,后续启动流程可进入主界面。',
    notFoundTitle: '未检测到 Scoop',
    notFoundSubtitle: '当前无法进入主界面,主功能依赖 Scoop CLI 提供安装、卸载与更新能力。',
    errorTitle: '检测失败',
    errorSubtitle: '检测过程返回错误,可重新检测或按下方说明协助安装。',
    stageDetecting: 'BootStage · DETECTING',
    stageReady: 'BootStage · READY',
    stageNotFound: 'BootStage · NOT_FOUND',
    stageError: 'BootStage · ERROR',
    progressLabel: '检测进度',
    versionLabel: '版本',
    pathLabel: '路径',
    configPreviewTitle: '安装配置预览 · 8 项',
    configPreviewSubtitle: '字段严格对齐 install.ps1 参数,默认值与官方脚本一致。',
  },
  configOptions: [
    { key: 'ScoopDir', label: 'Scoop 安装目录', description: 'Scoop 程序与用户安装包根目录。', defaultValue: '~/scoop', risk: '基础路径' },
    { key: 'ScoopGlobalDir', label: '全局目录', description: '全局应用安装位置。', defaultValue: '官方默认', risk: '可能需要管理员权限' },
    { key: 'ScoopCacheDir', label: '缓存目录', description: '下载与解压缓存位置。', defaultValue: '~/scoop/cache', risk: '可复用' },
    { key: 'NoProxy', label: '不使用代理', description: '强制直连,忽略系统代理。', defaultValue: 'false', risk: '网络' },
    { key: 'Proxy', label: '代理地址', description: 'HTTP 代理地址。', defaultValue: '空', risk: '网络' },
    { key: 'ProxyCredential', label: '代理凭据', description: '代理用户名与密码。', defaultValue: '空', risk: '敏感' },
    { key: 'ProxyUseDefaultCredentials', label: '默认凭据', description: '使用当前 Windows 登录身份认证。', defaultValue: 'false', risk: '认证' },
    { key: 'RunAsAdmin', label: '管理员运行', description: '协助安装时触发 UAC 提权。', defaultValue: 'false', risk: '权限' },
  ],
  checklist: {
    title: '启动检测清单',
    subtitle: '基于 scoop:onboarding:check 的结果可视化关键环境项。',
    foundVersion: '检测到版本 {{version}}',
    foundPath: '路径 {{path}}',
    noVersion: '未返回版本号',
    noPath: '未找到可执行路径',
    items: {
      scoopCommand: { label: 'Scoop 命令', command: 'where scoop' },
      scoopCore: { label: 'Scoop Core', command: 'scoop --version' },
      envVars: { label: '环境变量', command: 'SCOOP / SCOOP_GLOBAL' },
      powershell: { label: 'PowerShell', command: 'pwsh.exe / powershell.exe' },
      path: { label: 'PATH', command: '%USERPROFILE%\\scoop\\shims' },
    },
    states: {
      passed: '已通过',
      failed: '未通过',
      pending: '待确认',
      checking: '检测中',
    },
  },
  installGuide: {
    title: '下一步 · 协助安装',
    subtitle: '未检测到 Scoop 时,可在产品内填写安装配置并进入 P08 查看进度。',
    introTitle: '为什么需要安装 Scoop',
    introDesc: 'Scoop GUI 的安装、卸载、更新与桶管理都依赖本机 Scoop CLI。完成安装并复检通过后才能进入主界面。',
    requirementsTitle: '安装前确认',
    requirements: ['需要联网下载官方 install.ps1、Git 与 7zip。', '安装过程中会锁定本次配置,避免任务进行时被修改。', '涉及全局目录时可能弹出 UAC 管理员提权。'],
    fieldsTitle: '安装配置 · 8 项',
    fieldsSubtitle: '只展示 ScoopDir / ScoopGlobalDir / ScoopCacheDir / NoProxy / Proxy / ProxyCredential / ProxyUseDefaultCredentials / RunAsAdmin。',
    pathsSection: '路径配置 · Paths',
    proxySection: '网络代理 · Proxy',
    privilegeSection: '权限 · Privilege',
    adminWarningTitle: '该配置可能需要管理员权限',
    adminWarningDesc: '填写全局目录或启用管理员运行后,协助安装可能触发 UAC 提权。不授予管理员权限时,涉及全局目录的应用可能失败。',
    validationTitle: '确认前校验',
    noValidationIssues: '当前配置可确认。',
    confirmNotice: '配置确认后将进入 P08 长时操作进度。',
    dialogTitle: '确认协助安装 Scoop',
    dialogDesc: '确认后本次配置将被锁定,安装进度由 P08 展示。当前任务仅接入检测页,安装通道由后续任务统一接入。',
    dialogConfirm: '确认并进入 P08',
    dialogCancel: '返回修改',
    p08Hint: 'P08 进度页后续接入',
    fields: {
      scoopDir: { label: 'Scoop 安装目录', key: 'ScoopDir', hint: 'Scoop 程序与所有用户安装包所在的根目录。默认 ~/scoop。', placeholder: '~/scoop' },
      scoopGlobalDir: { label: '全局目录', key: 'ScoopGlobalDir', hint: '留空使用官方默认值。填写后可能需要管理员权限。', placeholder: '留空使用默认' },
      scoopCacheDir: { label: '缓存目录', key: 'ScoopCacheDir', hint: '下载与解压缓存位置。', placeholder: '~/scoop/cache' },
      noProxy: { label: '不使用代理', key: 'NoProxy', hint: '勾选后强制走直连,忽略系统与下方代理设置。' },
      proxy: { label: '代理地址', key: 'Proxy', hint: '格式示例 http://user:pass@host:port。留空跟随系统。', placeholder: 'http://user:pass@host:port' },
      proxyCredentialUsername: { label: '代理用户名', key: 'ProxyCredential.username', placeholder: 'username' },
      proxyCredentialPassword: { label: '代理密码', key: 'ProxyCredential.password', placeholder: 'password' },
      proxyUseDefaultCredentials: { label: '使用默认凭据', key: 'ProxyUseDefaultCredentials', hint: '使用当前 Windows 登录身份认证,忽略上方的 ProxyCredential。' },
      runAsAdmin: { label: '以管理员身份运行', key: 'RunAsAdmin', hint: '启用后,涉及全局目录的应用可正常安装。' },
    },
    validation: {
      scoopDirRequired: 'ScoopDir 不能为空。',
      invalidPath: '路径包含 Windows 不支持的字符。',
      noProxyConflict: 'NoProxy 已启用时不应再填写 Proxy。',
      proxyCredentialIncomplete: '代理凭据需要同时填写用户名与密码。',
      defaultCredentialConflict: '使用默认凭据时不应再填写 ProxyCredential。',
    },
  },
  emptyState: {
    readyTitle: 'Scoop 已可用',
    readyDesc: '无需填写协助安装配置,后续启动流程可进入 P03 主界面壳。',
    readyAction: '继续启动',
    waitingTitle: '正在等待检测结果',
    waitingDesc: '检测期间无需操作,页面会在完成后展示下一步。',
    waitingAction: '检测中',
    errorTitle: '暂无可用结果',
    errorDesc: '如果长时间没有结果,请重新检测或检查 PATH。',
    errorAction: '重新检测',
  },
};

export const P01en: P01Copy = {
  page: {
    title: 'Startup Check & Assisted Install',
    subtitle: 'Install Scoop here when first launch or startup detection finds Scoop unavailable.',
    metaDetect: 'scoop:onboarding:check',
    metaLatency: 'usually < 200ms',
    metaFields: '8 install options',
  },
  common: {
    retry: 'Detect again',
    cancel: 'Cancel',
    later: 'Maybe later',
    back: 'Back to edit',
    confirm: 'Confirm',
    confirmInstall: 'Confirm install',
    confirmInstallAdmin: 'Confirm install as admin',
    enabled: 'Enabled',
    disabled: 'Disabled',
    optional: 'Optional',
    required: 'Required',
    unavailable: 'Unavailable',
    notConfigured: 'Not configured',
    checking: 'Checking',
    pending: 'Pending',
    pass: 'Pass',
    fail: 'Failed',
    empty: 'Empty',
  },
  statusHero: {
    detectingTitle: 'Checking whether Scoop is available',
    detectingSubtitle: 'Using where scoop and scoop --version to inspect this machine. Please wait.',
    readyTitle: 'Scoop detected',
    readySubtitle: 'Scoop CLI is available. The boot flow can continue to the main shell.',
    notFoundTitle: 'Scoop not detected',
    notFoundSubtitle: 'The main UI cannot open yet because install, uninstall, and update actions depend on Scoop CLI.',
    errorTitle: 'Detection failed',
    errorSubtitle: 'The detection task returned an error. Detect again or follow the assisted install guide below.',
    stageDetecting: 'BootStage · DETECTING',
    stageReady: 'BootStage · READY',
    stageNotFound: 'BootStage · NOT_FOUND',
    stageError: 'BootStage · ERROR',
    progressLabel: 'Detection progress',
    versionLabel: 'Version',
    pathLabel: 'Path',
    configPreviewTitle: 'Install option preview · 8 items',
    configPreviewSubtitle: 'Fields align with install.ps1 parameters and use official defaults.',
  },
  configOptions: [
    { key: 'ScoopDir', label: 'Scoop directory', description: 'Root directory for Scoop and user apps.', defaultValue: '~/scoop', risk: 'Base path' },
    { key: 'ScoopGlobalDir', label: 'Global directory', description: 'Location for global apps.', defaultValue: 'official default', risk: 'May require admin' },
    { key: 'ScoopCacheDir', label: 'Cache directory', description: 'Download and extraction cache.', defaultValue: '~/scoop/cache', risk: 'Reusable' },
    { key: 'NoProxy', label: 'No proxy', description: 'Force direct connection and ignore proxies.', defaultValue: 'false', risk: 'Network' },
    { key: 'Proxy', label: 'Proxy URL', description: 'HTTP proxy endpoint.', defaultValue: 'empty', risk: 'Network' },
    { key: 'ProxyCredential', label: 'Proxy credentials', description: 'Proxy username and password.', defaultValue: 'empty', risk: 'Sensitive' },
    { key: 'ProxyUseDefaultCredentials', label: 'Default credentials', description: 'Use current Windows identity.', defaultValue: 'false', risk: 'Auth' },
    { key: 'RunAsAdmin', label: 'Run as admin', description: 'Trigger UAC elevation for install.', defaultValue: 'false', risk: 'Privilege' },
  ],
  checklist: {
    title: 'Startup checklist',
    subtitle: 'Visualized from the scoop:onboarding:check result.',
    foundVersion: 'Version {{version}} detected',
    foundPath: 'Path {{path}}',
    noVersion: 'No version returned',
    noPath: 'No executable path found',
    items: {
      scoopCommand: { label: 'Scoop command', command: 'where scoop' },
      scoopCore: { label: 'Scoop Core', command: 'scoop --version' },
      envVars: { label: 'Environment variables', command: 'SCOOP / SCOOP_GLOBAL' },
      powershell: { label: 'PowerShell', command: 'pwsh.exe / powershell.exe' },
      path: { label: 'PATH', command: '%USERPROFILE%\\scoop\\shims' },
    },
    states: {
      passed: 'Passed',
      failed: 'Failed',
      pending: 'Pending',
      checking: 'Checking',
    },
  },
  installGuide: {
    title: 'Next · Assisted install',
    subtitle: 'When Scoop is not detected, fill in install options and use P08 to observe progress.',
    introTitle: 'Why Scoop is required',
    introDesc: 'Scoop GUI depends on the local Scoop CLI for installs, uninstalls, updates, and bucket management. The main UI opens only after install and post-check pass.',
    requirementsTitle: 'Before installing',
    requirements: ['Network access is required to download official install.ps1, Git, and 7zip.', 'The confirmed configuration is locked while the install task is running.', 'Global directories may trigger UAC elevation.'],
    fieldsTitle: 'Install options · 8 items',
    fieldsSubtitle: 'Only ScoopDir / ScoopGlobalDir / ScoopCacheDir / NoProxy / Proxy / ProxyCredential / ProxyUseDefaultCredentials / RunAsAdmin are exposed.',
    pathsSection: 'Paths',
    proxySection: 'Proxy',
    privilegeSection: 'Privilege',
    adminWarningTitle: 'This configuration may require administrator privileges',
    adminWarningDesc: 'A global directory or admin run can trigger UAC elevation. Without admin privileges, global installs may fail.',
    validationTitle: 'Pre-confirm validation',
    noValidationIssues: 'Current configuration can be confirmed.',
    confirmNotice: 'After confirmation, the flow enters P08 long-running progress.',
    dialogTitle: 'Confirm assisted Scoop install',
    dialogDesc: 'After confirmation, this configuration is locked and P08 displays progress. This task only wires the detection page; the install channel is integrated later.',
    dialogConfirm: 'Confirm and open P08',
    dialogCancel: 'Back to edit',
    p08Hint: 'P08 progress page integration pending',
    fields: {
      scoopDir: { label: 'Scoop directory', key: 'ScoopDir', hint: 'Root directory for Scoop and user apps. Default ~/scoop.', placeholder: '~/scoop' },
      scoopGlobalDir: { label: 'Global directory', key: 'ScoopGlobalDir', hint: 'Leave empty to use the official default. May require admin.', placeholder: 'leave empty for default' },
      scoopCacheDir: { label: 'Cache directory', key: 'ScoopCacheDir', hint: 'Download and extraction cache location.', placeholder: '~/scoop/cache' },
      noProxy: { label: 'No proxy', key: 'NoProxy', hint: 'Force direct connection and ignore system or custom proxy settings.' },
      proxy: { label: 'Proxy URL', key: 'Proxy', hint: 'Example http://user:pass@host:port. Empty follows system settings.', placeholder: 'http://user:pass@host:port' },
      proxyCredentialUsername: { label: 'Proxy username', key: 'ProxyCredential.username', placeholder: 'username' },
      proxyCredentialPassword: { label: 'Proxy password', key: 'ProxyCredential.password', placeholder: 'password' },
      proxyUseDefaultCredentials: { label: 'Use default credentials', key: 'ProxyUseDefaultCredentials', hint: 'Use the current Windows login identity and ignore ProxyCredential.' },
      runAsAdmin: { label: 'Run as administrator', key: 'RunAsAdmin', hint: 'Allows global-directory operations during assisted install.' },
    },
    validation: {
      scoopDirRequired: 'ScoopDir is required.',
      invalidPath: 'The path contains characters unsupported by Windows.',
      noProxyConflict: 'Proxy should be empty when NoProxy is enabled.',
      proxyCredentialIncomplete: 'Proxy credentials require both username and password.',
      defaultCredentialConflict: 'ProxyCredential should be empty when default credentials are enabled.',
    },
  },
  emptyState: {
    readyTitle: 'Scoop is available',
    readyDesc: 'No assisted install configuration is required. The boot flow can continue to the P03 main shell.',
    readyAction: 'Continue boot',
    waitingTitle: 'Waiting for detection result',
    waitingDesc: 'No action is needed while detection is running. The next step appears automatically.',
    waitingAction: 'Checking',
    errorTitle: 'No usable result yet',
    errorDesc: 'If this takes too long, detect again or check PATH.',
    errorAction: 'Detect again',
  },
};
