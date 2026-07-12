# API 契约 · scoop-gui · electron 端

> 文档层级:模块端契约(架构师产出,等用户审批)
> 适用范围:scoop-gui 模块 electron 端全部 IPC 通道
> 上游依赖:
> - `docs/prd/project.md`(已审批)
> - `docs/prd/roles.md`(已审批)
> - `docs/prd/glossary.md`(已审批)
> - `docs/prd/modules/scoop-gui.md`(已审批,§4 "数据来源" 是设计依据)
> - `docs/prd/flows/scoop-gui.md`(已审批)
> - `docs/prd/pages/electron/scoop-gui/P01-P10.md`(已审批)
> - `ARCHITECTURE.md`(已审批,§2 进程拓扑 / §8 错误处理 / §9 IPC 契约总览)
> - `TECH.md`(已审批,§4 错误码 / §5 共享枚举 / §6 IPC 通道命名 / §10 跨层禁止)
> - `docs/acceptance/scoop-cli-reference.md`(已草稿,§3 解析样本 + §7 install.ps1 参数)
> 下游引用:developer(基于此实现 ipc-router / preload / 渲染端 ipc-client)/ qa(基于此做契约符合性测试)

---

## 1. 契约总则

### 1.1 通道命名

格式遵循 `TECH.md` §6:`scoop:<domain>:<action>[:vN]`。本项目 MVP 用 v1(省略)。

- 调用通道(renderer → main):`ipcMain.handle(<channel>, ...)` + `ipcRenderer.invoke(<channel>, ...)`。
- 进度事件(main → renderer):`webContents.send(<channel>:progress, payload)`,由 preload 转发订阅。

### 1.2 错误返回统一形态

遵循 `ARCHITECTURE.md` §8.1 + `TECH.md` §4.1:

```ts
type IPCResult<T> = { ok: true; data: T } | { ok: false; error: IPCError };

interface IPCError {
  code: string;        // 错误码,见 §3 错误码枚举
  message: string;     // 业务可读消息(可经 i18n 翻译,key 形式)
  cause?: unknown;     // 原始错误,仅用于日志,不在渲染端 UI 展示
}
```

**全部 IPC 通道的出参统一为 `IPCResult<T>`**,内部 `data` 字段对应本文档中各通道定义的"业务返回类型"。

### 1.3 入参校验

`ipcMain.handle` 处理器第一行必须对入参做 zod 校验(`TECH.md` §10 跨层禁止)。校验失败时:

- 抛出 `E_IPC_INVALID_INPUT`(`ARCHITECTURE.md` §8.2)
- 不进入 scoop-service 层
- 不向 stderr 写原始堆栈(写入结构化日志,见 `TECH.md` §7)

### 1.4 共享类型与枚举入口

- 全部 zod schema 必须显式 `export`,仅放在 `src/shared/ipc-contract.ts`(`ARCHITECTURE.md` §1)。
- 共享枚举(`AppState` / `ScoopState` / `BucketState` / `InstallJobState` / `BootStage` / `UILanguage` / `ErrorCode`)唯一变更入口 `src/shared/enums.ts`(`TECH.md` §5.1,仅架构师可改)。
- 渲染端**禁止**直接 import `'electron'`(`TECH.md` §10);仅通过 `window.api.*` 访问 IPC。

### 1.5 进度事件统一结构

```ts
interface ProgressEvent<P = ProgressChunk> {
  jobId: string;       // 任务唯一标识(UUID v4),由主进程生成,渲染端用于定位 useProgress(jobId)
  channel: string;     // 源通道名(如 'scoop:apps:install')
  state: InstallJobState;  // 见 §2 共享枚举
  chunk?: P;           // 当前进度切片(可选,终态时省略)
  error?: IPCError;    // 终态为 failed 时填充
  ts: number;          // 事件时间戳(ms since epoch,主进程 Date.now())
}
```

渲染端订阅约定:在调用写操作通道的同一个 `window.api.*` 同步上下文里 `useProgress(jobId)` 订阅;写操作 promise resolve 后,渲染端需主动关闭订阅(避免内存泄漏)。

---

## 2. 共享 zod schema(显式导出)

> 全部定义在 `src/shared/ipc-contract.ts`,被 main / preload / renderer 三端共享。
> 命名遵循 `TECH.md` §2.3(PascalCase 类型 / camelCase 函数 / UPPER_SNAKE_CASE 错误码)。

### 2.1 枚举 / 字面量联合

```ts
export const UILanguageSchema = z.enum(['zh-CN', 'en-US']);
export type UILanguage = z.infer<typeof UILanguageSchema>;

export const InstallJobStateSchema = z.enum([
  'queued',     // 已入队,等待 MAX_PARALLEL_JOBS 放行
  'running',    // 子进程已启动,正在收行
  'succeeded',  // 退出码 0
  'failed',     // 退出码非 0 / 解析失败 / 超时
  'cancelled',  // 用户主动取消
]);
export type InstallJobState = z.infer<typeof InstallJobStateSchema>;

// 见 TECH.md §5.1,完整枚举仅 src/shared/enums.ts 维护,此处只复用,不重定义。
```

### 2.2 业务对象 schema

```ts
// 来自 docs/acceptance/scoop-cli-reference.md §3.3 scoop list 表格解析
export const AppInfoSchema = z.object({
  name: z.string().min(1),                 // 包名,如 '7zip'
  version: z.string(),                      // 已装版本(空字符串表示解析失败占位)
  source: z.string(),                       // 所属桶,如 'main' / 'extras'
  updated: z.string().optional(),           // 安装/更新时间,原样字符串保留
  info: z.string().optional(),              // 备注列(可能为空)
});
export type AppInfo = z.infer<typeof AppInfoSchema>;

// 来自 docs/acceptance/scoop-cli-reference.md §3.4 scoop status 表格解析
export const OutdatedAppSchema = z.object({
  name: z.string().min(1),
  installed: z.string(),                    // 本机版本
  latest: z.string(),                       // 桶内最新版本(可能为空:Manifest removed)
  missing: z.string().optional(),           // 缺失依赖列表
  info: z.string().optional(),              // 'Install failed, Manifest removed' 等备注
  isOutdated: z.boolean(),                  // 计算字段:installed !== latest 且 latest 非空
});
export type OutdatedApp = z.infer<typeof OutdatedAppSchema>;

// 来自 docs/acceptance/scoop-cli-reference.md §3.5 scoop bucket list 表格解析
export const BucketInfoSchema = z.object({
  name: z.string().min(1),                  // 桶名
  source: z.string().url(),                 // git 仓库 URL
  updated: z.string().optional(),           // 最后更新
  manifests: z.number().int().nonnegative().optional(), // manifest 数量
});
export type BucketInfo = z.infer<typeof BucketInfoSchema>;

// 来自 docs/acceptance/scoop-cli-reference.md §3.6 scoop bucket known 每行一桶
export const KnownBucketSchema = z.object({
  name: z.string().min(1),                  // 桶名
  repo: z.string().url().optional(),        // 默认 repo(可选,部分已知桶官方未公布默认仓库)
});
export type KnownBucket = z.infer<typeof KnownBucketSchema>;

// scoop info <name> 解析,样本待采集(scoop-cli-reference.md §3.7 TODO),
// 此处给保守 schema,字段缺失时 zod 校验失败走 E_SCOOP_PARSE_FAILED
export const AppDetailSchema = AppInfoSchema.extend({
  description: z.string().optional(),
  homepage: z.string().url().optional(),
});
export type AppDetail = z.infer<typeof AppDetailSchema>;
```

### 2.3 持久化(PPreferences)

```ts
// 来自 ARCHITECTURE.md §7.1
export const ScoopInstallConfigSchema = z.object({
  scoopDir: z.string().min(1),
  scoopGlobalDir: z.string().optional(),
  scoopCacheDir: z.string().optional(),
  noProxy: z.boolean(),
  proxy: z.string().optional(),             // 'http://user:pass@host:port'
  proxyCredential: z
    .object({ username: z.string(), password: z.string() })
    .optional(),
  proxyUseDefaultCredentials: z.boolean(),
  runAsAdmin: z.boolean(),
});
export type ScoopInstallConfig = z.infer<typeof ScoopInstallConfigSchema>;

export const WindowBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type WindowBounds = z.infer<typeof WindowBoundsSchema>;

export const PreferencesSchema = z.object({
  uiLanguage: UILanguageSchema,
  onboardingCompleted: z.boolean(),
  scoopInstallConfig: ScoopInstallConfigSchema.optional(),
  windowBounds: WindowBoundsSchema.optional(),
});
export type Preferences = z.infer<typeof PreferencesSchema>;
```

### 2.4 进度载荷

```ts
// 单条进度切片,主进程行缓冲解析后产出
export const ProgressChunkSchema = z.object({
  raw: z.string(),                          // 原始一行文本(已 trim),用于调试日志
  stage: z.enum([                           // 解析出的阶段
    'downloading',
    'extracting',
    'installing',
    'uninstalling',
    'updating',
    'cloning',                              // 桶添加专用
    'removing',                             // 桶移除专用
    'message',                              // 通用消息
  ]),
  percent: z.number().min(0).max(100).optional(),  // 下载/解压百分比,无法解析时省略
  url: z.string().url().optional(),                  // 当前下载 URL(若有)
  bytes: z.number().int().nonnegative().optional(),  // 当前已下载字节(若有)
});
export type ProgressChunk = z.infer<typeof ProgressChunkSchema>;

// 进度事件 envelope,见 §1.5
export const ProgressEventSchema = z.object({
  jobId: z.string().uuid(),
  channel: z.string().min(1),
  state: InstallJobStateSchema,
  chunk: ProgressChunkSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      cause: z.unknown().optional(),
    })
    .optional(),
  ts: z.number().int().positive(),
});
export type ProgressEvent<T = ProgressChunk> = z.infer<typeof ProgressEventSchema> & {
  chunk?: T;
};
```

### 2.5 入参 / 出参通用壳

```ts
// 写操作(命令式)的最小出参
export const OkResultSchema = z.object({ ok: z.boolean(), message: z.string().optional() });
export type OkResult = z.infer<typeof OkResultSchema>;
```

---

## 3. 错误码枚举

> 命名遵循 `ARCHITECTURE.md` §8.2 + `TECH.md` §4.2:`E_<DOMAIN>_<ACTION>_<REASON>`,全大写,下划线分隔。
> 集中维护于 `src/shared/enums.ts` 的 `ErrorCode` 字符串联合(`TECH.md` §5.1,仅架构师可改)。
> 消息文案以 i18n key 形式提供(`ARCHITECTURE.md` §6 决策采用 i18next 候选方案 A,待用户确认),具体 key 形态由 designer / developer 在实现期对齐,本文档不绑定文案。

### 3.1 环境探测类

| 错误码 | 触发场景 | 关联通道 |
| --- | --- | --- |
| `E_SCOOP_NOT_FOUND` | `where scoop` 探测失败 / `scoop --version` 进程不存在 | `scoop:onboarding:check` |
| `E_SCOOP_VERSION_PARSE_FAILED` | `scoop --version` 退出 0 但输出无法解析为版本号 | `scoop:onboarding:check` |

### 3.2 命令执行类(读 / 写通用)

| 错误码 | 触发场景 | 关联通道 |
| --- | --- | --- |
| `E_SCOOP_SPAWN_FAILED` | `child_process.spawn('scoop', ...)` 抛出(命令不存在 / PATH 不含 shims) | 所有走 scoop CLI 的通道 |
| `E_SCOOP_INSTALL_TIMEOUT` | 命令执行超过 `SCOOP_INSTALL_TIMEOUT_MS`(默认 10 分钟,见 `TECH.md` §5.2) | 全部写操作通道 |
| `E_SCOOP_INSTALL_FAILED` | 命令退出码非 0 | 全部写操作通道 |
| `E_SCOOP_PARSE_FAILED` | 命令退出 0 但 stdout/stderr 无法按 zod schema 解析 | 全部读操作通道 |
| `E_SCOOP_PERMISSION_DENIED` | 命令 stderr 含 `ERROR Access is denied` / 需管理员 | `scoop:apps:install` / `:uninstall` / `:update` 等 |

### 3.3 协助安装专用

| 错误码 | 触发场景 | 关联通道 |
| --- | --- | --- |
| `E_ONBOARDING_INSTALL_FAILED` | PowerShell 执行 `install.ps1` 失败(网络 / 权限 / 脚本错误) | `scoop:onboarding:install` |
| `E_ONBOARDING_PS_NOT_FOUND` | 系统未安装 PowerShell(Windows 默认必有,异常环境兜底) | `scoop:onboarding:install` |
| `E_ONBOARDING_POSTCHECK_FAILED` | 安装脚本退出 0 但事后 `scoop --version` 复检失败 | `scoop:onboarding:install` |

### 3.4 持久化 / 偏好

| 错误码 | 触发场景 | 关联通道 |
| --- | --- | --- |
| `E_PREFERENCES_INVALID` | `preferences.json` 读取后 zod 校验失败,已回退默认 | `scoop:prefs:get` |
| `E_PREFERENCES_WRITE_FAILED` | 写 `preferences.json` 失败(磁盘满 / 权限) | `scoop:prefs:set` |

### 3.5 IPC 校验

| 错误码 | 触发场景 | 关联通道 |
| --- | --- | --- |
| `E_IPC_INVALID_INPUT` | 入参 zod 校验失败(主进程 `ipcMain.handle` 抛) | 全部 |

### 3.6 任务管理(预留)

| 错误码 | 触发场景 | 关联通道 |
| --- | --- | --- |
| `E_JOB_NOT_FOUND` | 渲染端用未知 `jobId` 订阅进度(`useProgress(unknownId)`) | 进度事件订阅 |
| `E_JOB_CANCELLED` | 用户主动取消写操作,终态消息 | 全部写操作通道 |
| `E_BUCKET_ADD_FAILED` | `scoop bucket add` 退出非 0 | `scoop:buckets:add` |
| `E_BUCKET_REMOVE_FAILED` | `scoop bucket rm` 退出非 0 | `scoop:buckets:remove` |

> 备注:`E_JOB_*` 暂不暴露为独立 IPC 通道;渲染端通过 `ProgressEvent.error.code` 接收。当前列在枚举中仅为**未来阶段**(`/scoop:jobs:cancel` 等)预留,本文档不为之定义通道。

---

## 4. 通道清单

> 表格中"数据来源"列引用 `docs/prd/modules/scoop-gui.md` §4;通道命名遵守 `TECH.md` §6。
> 所有出参外层均为 `IPCResult<T>`,下表"业务返回类型"指 `IPCResult` 的 `data` 字段类型。

### 4.1 启动期 · onboarding

#### `scoop:onboarding:check`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F15(`docs/prd/modules/scoop-gui.md` §2.5) |
| 关联页面 | P01 |
| 入参 | 无(空 payload `{}`,zod 用 `z.object({}).strict()`) |
| 业务返回类型 | `{ available: boolean; version?: string; path?: string }` |
| 错误码 | `E_SCOOP_NOT_FOUND` / `E_SCOOP_VERSION_PARSE_FAILED` / `E_SCOOP_SPAWN_FAILED` |
| 进度事件 | 无 |
| 幂等性 | 是(只读探测) |

```ts
const CheckInputSchema = z.object({}).strict();
const CheckOutputSchema = z.object({
  available: z.boolean(),
  version: z.string().optional(),
  path: z.string().optional(),
});
```

实现要点:主进程跑 `where scoop` 拿路径 + `scoop --version` 拿版本;任一失败 → `available: false` + 错误码;两者成功 → `available: true` + 解析出的 `version` + `path`。

#### `scoop:onboarding:install`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main(返回 `{ ok, message }`)+ main → renderer 进度事件 |
| 关联功能 | F16 / F17 / F19 |
| 关联页面 | P01 / P08 |
| 入参 | `ScoopInstallConfig`(直接复用 §2.3 schema 的字段子集,无 `proxyCredential` 外的额外字段) |
| 业务返回类型 | `{ ok: boolean }` |
| 进度事件 | `scoop:onboarding:install:progress`(payload 见 §1.5,`channel` 字段为 `scoop:onboarding:install`) |
| 错误码 | `E_ONBOARDING_INSTALL_FAILED` / `E_ONBOARDING_PS_NOT_FOUND` / `E_ONBOARDING_POSTCHECK_FAILED` / `E_SCOOP_INSTALL_TIMEOUT` / `E_IPC_INVALID_INPUT` |

```ts
const InstallInputSchema = ScoopInstallConfigSchema;
const InstallOutputSchema = z.object({ ok: z.boolean() });
```

实现要点:PowerShell 执行 `install.ps1` + 参数映射见 `docs/acceptance/scoop-cli-reference.md` §7;成功后调用 `scoop:onboarding:check` 复检。

### 4.2 软件包 · apps

#### `scoop:apps:listInstalled`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F01(已装部分) / F04 |
| 关联页面 | P04 |
| 入参 | 无 |
| 业务返回类型 | `AppInfo[]` |
| 错误码 | `E_SCOOP_SPAWN_FAILED` / `E_SCOOP_PARSE_FAILED` |
| 进度事件 | 无 |

```ts
const ListInstalledOutputSchema = z.array(AppInfoSchema);
```

#### `scoop:apps:search`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F02 |
| 关联页面 | P05 |
| 入参 | `{ query: string }`(空字符串等价于"列出全部已添加桶内可装应用",由 `scoop search` 原生支持) |
| 业务返回类型 | `AppInfo[]`(沿用同一 schema,`source` 字段恒为桶名) |
| 错误码 | `E_SCOOP_SPAWN_FAILED` / `E_SCOOP_PARSE_FAILED` / `E_IPC_INVALID_INPUT` |

```ts
const SearchInputSchema = z.object({ query: z.string() });
const SearchOutputSchema = z.array(AppInfoSchema);
```

#### `scoop:apps:info`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F04 |
| 关联页面 | P07 |
| 入参 | `{ name: string }` |
| 业务返回类型 | `AppDetail | null`(null = scoop CLI 返回"找不到该包") |
| 错误码 | `E_SCOOP_SPAWN_FAILED` / `E_SCOOP_PARSE_FAILED` / `E_IPC_INVALID_INPUT` |

```ts
const InfoInputSchema = z.object({ name: z.string().min(1) });
const InfoOutputSchema = AppDetailSchema.nullable();
```

> 备注:`scoop info <name>` 解析样本待采集(`docs/acceptance/scoop-cli-reference.md` §3.7);`AppDetail` schema 是基于 §3.3 / §3.7 已有约定的保守猜测,样本齐备后架构师单次微调。

#### `scoop:apps:status`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F03 |
| 关联页面 | P04 |
| 入参 | 无 |
| 业务返回类型 | `OutdatedApp[]`(含未过期但已装的应用;`isOutdated: false` 供 UI 区分) |
| 错误码 | `E_SCOOP_SPAWN_FAILED` / `E_SCOOP_PARSE_FAILED` |
| 进度事件 | 无 |

```ts
const StatusOutputSchema = z.array(OutdatedAppSchema);
```

#### `scoop:apps:install`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main + main → renderer 进度事件 |
| 关联功能 | F05 / F17 / F19 |
| 关联页面 | P05 / P07 / P08 |
| 入参 | `{ name: string; bucket?: string; global: boolean }` |
| 业务返回类型 | `{ ok: boolean; message: string }`(终态消息:成功 / 失败原因) |
| 进度事件 | `scoop:apps:install:progress`(`channel` = `scoop:apps:install`) |
| 错误码 | `E_SCOOP_INSTALL_FAILED` / `E_SCOOP_PERMISSION_DENIED` / `E_SCOOP_INSTALL_TIMEOUT` / `E_IPC_INVALID_INPUT` / `E_JOB_CANCELLED` |

```ts
const AppsInstallInputSchema = z.object({
  name: z.string().min(1),
  bucket: z.string().optional(),        // 不指定时走 'extras' 之外的默认桶发现;PRD D11 不携带额外 options
  global: z.boolean(),                  // --global;UI 不暴露(默认 false);传 true 需管理员
});
const AppsActionOutputSchema = OkResultSchema.refine(
  (v) => typeof v.message === 'string',
  { message: 'message field is required for install' },
);
```

实现要点:`command-runner.runScoop(['install', name], { global })`;`global: true` 时由 `scoop-service` 判断当前是否管理员,非管理员 → 返回 `E_SCOOP_PERMISSION_DENIED` 不再 spawn。

#### `scoop:apps:uninstall`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main + main → renderer 进度事件 |
| 关联功能 | F06 / F17 / F19 |
| 关联页面 | P04 / P07 / P08 |
| 入参 | `{ name: string; global: boolean }` |
| 业务返回类型 | `{ ok: boolean; message: string }` |
| 进度事件 | `scoop:apps:uninstall:progress`(`channel` = `scoop:apps:uninstall`) |
| 错误码 | `E_SCOOP_INSTALL_FAILED` / `E_SCOOP_PERMISSION_DENIED` / `E_SCOOP_INSTALL_TIMEOUT` / `E_IPC_INVALID_INPUT` / `E_JOB_CANCELLED` |

```ts
const AppsUninstallInputSchema = z.object({
  name: z.string().min(1),
  global: z.boolean(),
});
```

#### `scoop:apps:update`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main + main → renderer 进度事件 |
| 关联功能 | F07 / F08 / F17 / F19 |
| 关联页面 | P04 / P08 |
| 入参 | `{ name?: string; global: boolean }`(`name` 省略时 = `scoop update *`(批量更新所有过期)) |
| 业务返回类型 | `{ ok: boolean; message: string }` |
| 进度事件 | `scoop:apps:update:progress`(`channel` = `scoop:apps:update`) |
| 错误码 | `E_SCOOP_INSTALL_FAILED` / `E_SCOOP_PERMISSION_DENIED` / `E_SCOOP_INSTALL_TIMEOUT` / `E_IPC_INVALID_INPUT` / `E_JOB_CANCELLED` |

```ts
const AppsUpdateInputSchema = z.object({
  name: z.string().min(1).optional(),
  global: z.boolean(),
});
```

实现要点:批量更新(F08)实际是**主进程内串行启动多个 InstallJob**(受 `MAX_PARALLEL_JOBS = 1` 约束,见 `TECH.md` §5.2),每个 job 独立发送进度事件,共享同一个外层 promise resolve。

### 4.3 桶 · buckets

#### `scoop:buckets:list`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F09 / F01(可装部分) |
| 关联页面 | P06 |
| 入参 | 无 |
| 业务返回类型 | `BucketInfo[]` |
| 错误码 | `E_SCOOP_SPAWN_FAILED` / `E_SCOOP_PARSE_FAILED` |

#### `scoop:buckets:known`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F10 |
| 关联页面 | P06 |
| 入参 | 无 |
| 业务返回类型 | `KnownBucket[]` |
| 错误码 | `E_SCOOP_SPAWN_FAILED` / `E_SCOOP_PARSE_FAILED` |

#### `scoop:buckets:add`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main + main → renderer 进度事件 |
| 关联功能 | F11 / F17 / F19 |
| 关联页面 | P06 / P08 |
| 入参 | `{ name: string; repo?: string }`(`repo` 省略 → 已知桶官方默认仓库;`name` 在 `scoop:buckets:known` 列表中可省略 repo) |
| 业务返回类型 | `{ ok: boolean; message: string }` |
| 进度事件 | `scoop:buckets:add:progress`(`channel` = `scoop:buckets:add`,`stage` 主要为 `'cloning'`) |
| 错误码 | `E_BUCKET_ADD_FAILED` / `E_SCOOP_INSTALL_TIMEOUT` / `E_IPC_INVALID_INPUT` |

```ts
const BucketAddInputSchema = z.object({
  name: z.string().min(1),
  repo: z.string().url().optional(),
});
```

#### `scoop:buckets:remove`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main + main → renderer 进度事件 |
| 关联功能 | F12 / F17 / F19 |
| 关联页面 | P06 / P08 |
| 入参 | `{ name: string }` |
| 业务返回类型 | `{ ok: boolean; message: string }` |
| 进度事件 | `scoop:buckets:remove:progress`(`channel` = `scoop:buckets:remove`,`stage` 主要为 `'removing'`) |
| 错误码 | `E_BUCKET_REMOVE_FAILED` / `E_SCOOP_INSTALL_TIMEOUT` / `E_IPC_INVALID_INPUT` |

```ts
const BucketRemoveInputSchema = z.object({ name: z.string().min(1) });
```

### 4.4 偏好 · prefs

#### `scoop:prefs:get`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F13 / F14(读取) |
| 关联页面 | P02 / P03 / P09 |
| 入参 | 无 |
| 业务返回类型 | `Preferences`(经 `PreferencesSchema` 校验) |
| 错误码 | `E_PREFERENCES_INVALID`(文件存在但 schema 不匹配 → 已回退默认,主进程日志记录) |
| 进度事件 | 无 |

实现要点:`app.getPath('userData')/preferences.json` 不存在时,直接返回默认 `Preferences`(`ARCHITECTURE.md` §7.1)。

#### `scoop:prefs:set`

| 项 | 值 |
| --- | --- |
| 方向 | renderer → main |
| 关联功能 | F13 / F14 / F16(写入协助安装配置项) |
| 关联页面 | P01 / P02 / P09 |
| 入参 | `Partial<Preferences>`(深度合并,见 `ARCHITECTURE.md` §7.1) |
| 业务返回类型 | `{ ok: boolean }` |
| 错误码 | `E_PREFERENCES_WRITE_FAILED` / `E_IPC_INVALID_INPUT` |
| 进度事件 | 无 |

```ts
const PrefsSetInputSchema = PreferencesSchema.partial();
const PrefsSetOutputSchema = z.object({ ok: z.boolean() });
```

---

## 5. 通道速查表(供 developer 索引)

| 通道 | 方向 | 入参 | 出参 data | 进度事件 |
| --- | --- | --- | --- | --- |
| `scoop:onboarding:check` | r→m | `{}` | `{ available, version?, path? }` | — |
| `scoop:onboarding:install` | r→m | `ScoopInstallConfig` | `{ ok }` | `scoop:onboarding:install:progress` |
| `scoop:apps:listInstalled` | r→m | `{}` | `AppInfo[]` | — |
| `scoop:apps:search` | r→m | `{ query }` | `AppInfo[]` | — |
| `scoop:apps:info` | r→m | `{ name }` | `AppDetail \| null` | — |
| `scoop:apps:status` | r→m | `{}` | `OutdatedApp[]` | — |
| `scoop:apps:install` | r→m | `{ name, bucket?, global }` | `{ ok, message }` | `scoop:apps:install:progress` |
| `scoop:apps:uninstall` | r→m | `{ name, global }` | `{ ok, message }` | `scoop:apps:uninstall:progress` |
| `scoop:apps:update` | r→m | `{ name?, global }` | `{ ok, message }` | `scoop:apps:update:progress` |
| `scoop:buckets:list` | r→m | `{}` | `BucketInfo[]` | — |
| `scoop:buckets:known` | r→m | `{}` | `KnownBucket[]` | — |
| `scoop:buckets:add` | r→m | `{ name, repo? }` | `{ ok, message }` | `scoop:buckets:add:progress` |
| `scoop:buckets:remove` | r→m | `{ name }` | `{ ok, message }` | `scoop:buckets:remove:progress` |
| `scoop:prefs:get` | r→m | `{}` | `Preferences` | — |
| `scoop:prefs:set` | r→m | `Partial<Preferences>` | `{ ok }` | — |

---

## 6. 文档范围声明

本文件(`docs/architecture/api/electron/scoop-gui.md`)是模块端契约,只回答:

- scoop-gui 模块 electron 端**全部 IPC 通道的契约**(通道名 / 方向 / 入参 / 出参 / 错误码 / 进度事件);
- **共享 zod schema 的显式定义**(被 main / preload / renderer 三端共享);
- **错误码枚举的集中定义**(命名遵循 `ARCHITECTURE.md` §8.2 + `TECH.md` §4.2);
- **进度事件 envelope 的统一结构**(供 useProgress hook 与 webContents.send 对齐)。

**本文件不涉及**(以下条目均交由下游契约或角色负责):

- 任何 UI 形态、页面布局、交互细节、文案(由 designer / 页面 PRD 产出);
- IPC 处理器的具体业务实现(`scoop-service` / `command-runner` / `parsers` 的具体逻辑)—— 属于 developer 实现范畴;
- 状态机内部流转规则 —— 唯一出处为 `docs/prd/flows/scoop-gui.md`,本文档仅在枚举中复用 `InstallJobState`,不复述流转;
- i18n 文案 key 形态与具体翻译 —— 由 i18n 方案决策后由 designer / developer 在实现期对齐(`ARCHITECTURE.md` §6 待用户决策);
- 进度事件在渲染端的 React hook 实现 —— 由 developer 实现(`useProgress(jobId)` 仅是设计层面的占位命名);
- `scoop info <name>` 的实际解析细节 —— 待 `docs/acceptance/scoop-cli-reference.md` §3.7 样本采集后,由架构师单次微调 `AppDetailSchema`;
- 未来阶段预留接口(`ARCHITECTURE.md` §11 提到的 `scoop:config:*` / `scoop:shim:*` / `scoop:jobs:cancel`)—— 本 MVP 不在范围。

**单一出现原则**:

- 错误码定义唯一出处为 `src/shared/enums.ts`(`TECH.md` §5.1,仅架构师可改);本文档 §3 仅是文档化映射,**不重复实现**。
- 共享 zod schema 唯一出处为 `src/shared/ipc-contract.ts`(`ARCHITECTURE.md` §1);本文档 §2 仅是设计稿,**不重复实现**。
- IPC 通道命名规范唯一出处为 `TECH.md` §6;本文档 §4 严格遵循,未引入新格式。