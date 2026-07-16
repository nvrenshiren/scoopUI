# API 契约(Tauri IPC) · scoop-gui

> 文档层级:模块级契约(architect 产出)
> 适用范围:scoop-gui 模块(本项目唯一模块)
> 上游依赖:`docs/prd/modules/scoop-gui.md` 第 4 节"数据来源"、`docs/architecture/database/scoop-gui.md`
> 下游引用:developer(rust 端实现 / web 端调用)、qa(据此设计验收用例)
> 真相源:`src-tauri/src/commands.rs`(注册见 `lib.rs` `invoke_handler`);如与本文档有出入,以代码为准

---

## 1. 概述

本产品**没有网络 API**(不联网,project.md §3.3"软件源唯一性")——"API"specifically 指前端(web
端,`src/api.ts`)与 Rust 后端(rust 端)之间的 **Tauri IPC 命令契约**。命令分两类:

- **读命令**:直接 `invoke` 并 `await` 返回结果(`scoop_list` / `scoop_status` / `scoop_search` /
  `scoop_info` / `bucket_list` / `bucket_known` / `get_settings` / `detect_scoop`)。
- **写命令**:一律不直接返回结果,而是入队为 `InstallJob`,立即返回任务 `id`,过程与终态通过
  `job-changed` / `job-log` 事件推送(F17,见第 5 节)。

前端统一在 `src/api.ts` 封装每条命令;浏览器 mock 模式(无 `__TAURI_INTERNALS__` 时)在同文件内降级为假数据,契约形状必须与本文档一致。

> 例外:`scoop_config_get/set/rm`(F20,§3.16~3.18)是同步读写命令 —— 读直接读 scoop 配置文件、写走 `scoop config` CLI 即时生效,**均不**入 InstallJob 队列(配置写入是毫秒级操作,无需进度流)。

## 2. 安全校验(公共约束)

所有写操作与查询参数在 Rust 侧过 `commands.rs` 顶部的白名单正则,防止拼进 `cmd` 的参数携带元字符:

| 正则 | 用途 | 规则 |
| --- | --- | --- |
| `NAME_RE` | 包名 / 桶名(含 `bucket/name` 形式) | `^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$` |
| `REPO_RE` | 桶仓库地址(https URL 或 git 形式) | `^[A-Za-z0-9][A-Za-z0-9._:/@~+-]{0,255}$` |
| `QUERY_RE` | 搜索关键字 | `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` |
| `CONFIG_KEYS` | scoop config 键(白名单) | 32 项已知配置键的固定集合(见 `commands.rs`);非白名单键报 `unknown config key` |
| `CONFIG_VALUE_RE` | scoop config 值 | `^[A-Za-z0-9 ._:/\\@~+=,#-]{1,512}$`(覆盖路径/代理/日期/aria2 选项/令牌,排除 cmd 元字符) |

校验失败统一返回 `Err(String)`,前端按 F19"错误处理与友好提示"转换为业务语言提示。

## 3. 命令清单

### 3.1 `get_settings() -> Settings`
返回当前持久化设置(见 db-doc §3.1)。无参数,同步命令。

### 3.2 `set_language(language: string) -> Result<(), string>`
`language` 必须 ∈ `{"zh","en"}`,否则返回 `Err("unsupported language")`。成功后立即持久化(F13/F14)。

### 3.3 `set_theme(theme: string) -> Result<(), string>`
`theme` 必须 ∈ `{"dark","light","system"}`,否则报错。成功后立即持久化。

### 3.4 `detect_scoop() -> Result<DetectResult, string>`(异步)
F15。探测本机 `scoop` 可达性并缓存定位结果(`shims_dir`)供后续读/写命令注入 PATH。

```ts
interface DetectResult { available: boolean; version?: string; shimsDir?: string }
```

调试开关:环境变量 `SCOOP_GUI_FORCE_SETUP=1` 强制返回 `available:false`,用于在已装 Scoop 的机器上预览 P01(仅影响当前进程,无副作用,不对外暴露为 UI 开关)。

### 3.5 `scoop_list(query?: string) -> Result<InstalledApp[], string>`(异步)
F01(已装部分)/ F04。`query` 校验 `NAME_RE`;有值时对应 `scoop list <query>`(子串过滤,用于单包状态刷新,避免全量列表开销),无值时 `scoop list`。

```ts
interface InstalledApp { name: string; version: string; source: string; updated: string; info: string }
```

### 3.6 `scoop_status() -> Result<StatusEntry[], string>`(异步)
F03(过期检查)。对应 `scoop status`,无参数。

```ts
interface StatusEntry { name: string; installedVersion: string; latestVersion: string; missingDependencies: string; info: string }
```

### 3.7 `scoop_search(query?: string) -> Result<SearchResult[], string>`(异步)
F01(可装部分)/ F02。`query` 校验 `QUERY_RE`;对应 `scoop search [<query>]`。

```ts
interface SearchResult { name: string; version: string; source: string; binaries: string }
```

### 3.8 `scoop_info(name: string) -> Result<[string, string][], string>`(异步)
F04。`name` 校验 `NAME_RE`;对应 `scoop info <name>`。返回值为**字段名/字段值二元组数组**(而非固定
结构体)——因 `scoop info` 输出字段随包而异,前端按 `tf("detail.field."+key, key)` 做 i18n 回退展示。

### 3.9 `bucket_list() -> Result<BucketInfo[], string>`(异步)
F09。对应 `scoop bucket list`,无参数。

```ts
interface BucketInfo { name: string; source: string; updated: string; manifests: string }
```

### 3.10 `bucket_known() -> Result<string[], string>`(异步)
F10。对应 `scoop bucket known`,每行一个桶名。

### 3.11 `enqueue_job(kind: string, target: string, repo?: string) -> Result<u64, string>`
F05/F06/F07/F11/F12 的统一写入口。`kind` ∈
`{"install","uninstall","update","bucket-add","bucket-remove"}`,非法值报 `unknown job kind`;
`target` 校验 `NAME_RE`;`repo`(仅 `bucket-add` 用)非空时校验 `REPO_RE`。返回新建 `InstallJob` 的
`id`(立即返回,不等待执行完成)。

### 3.12 `install_scoop(config: InstallConfig) -> Result<u64, string>`
F16。`config` 形状见 db-doc §3.2。流程:持久化 `installConfig`(失败不阻塞,见 db-doc §4)→
`installer::prepare_runner` 生成 runner 脚本 → 以 `JobKind::InstallScoop` 入队,返回 `id`。

### 3.13 `cancel_job(id: u64) -> Result<(), string>`
对排队中任务直接标记取消;对执行中任务设置 `cancel_requested` 并 `taskkill /F /T /PID` 杀整棵进程树(cmd → powershell → 下载器),`id` 不存在报 `job not found`。终态任务调用无副作用。

### 3.14 `list_jobs() -> JobDto[]`
返回当前进程内全部 `InstallJob`(含终态),供 P08 面板渲染。

```ts
type JobKind = "install" | "uninstall" | "update" | "bucket-add" | "bucket-remove" | "install-scoop"
type JobState = "queued" | "running" | "succeeded" | "failed" | "cancelled"
interface JobDto { id: number; kind: JobKind; target: string; state: JobState; exitCode?: number }
```

### 3.15 `job_log(id: u64) -> string[]`
返回该任务累计的逐行输出(已清理 ANSI 转义与 `\r` 行内重绘,取每段最后非空内容)。`id` 不存在返回空数组(非错误)。

### 3.16 `scoop_config_get() -> Result<ScoopConfigMap, string>`(异步)
F20。直接读取 scoop 配置文件 `%USERPROFILE%\.config\scoop\config.json`(`XDG_CONFIG_HOME` 优先),返回"键→当前值"映射(仅含**已显式设置过**的项);文件缺失/解析失败返回空对象(视作全部为默认)。**不**经 scoop CLI,**不**入 InstallJob 队列。

```ts
type ScoopConfigValue = boolean | number | string | string[] | Record<string, unknown> | null
type ScoopConfigMap = Record<string, ScoopConfigValue>
```

### 3.17 `scoop_config_set(name: string, value: string) -> Result<(), string>`(异步)
F20。`name` 必须 ∈ `CONFIG_KEYS`(32 项白名单),否则报 `unknown config key`;`value` 校验 `CONFIG_VALUE_RE`。对应 `scoop config <name> <value>`,由 scoop 负责布尔/数值类型转换与切换分支等副作用。即时生效,不入队。

### 3.18 `scoop_config_rm(name: string) -> Result<(), string>`(异步)
F20。`name` 校验白名单;对应 `scoop config rm <name>`,恢复该项默认。

## 4. 事件流(前端订阅,非请求-响应)

| 事件名 | Payload | 触发时机 |
| --- | --- | --- |
| `job-changed` | `JobDto` | 任务状态跃迁时(排队中→执行中→终态),每次跃迁推送一次完整快照 |
| `job-log` | `{ id: number; line: string }` | 任务子进程每产出一行清理后的非空输出 |

## 5. InstallJob 状态机与并发模型

- **单 worker 顺序执行**:全部写操作(含协助安装 Scoop)共享一条 FIFO 队列(`mpsc::channel`),同一时刻只有一个子进程在跑,与 `docs/prd/flows/scoop-gui.md` §2.4 状态机一致。
- **状态**:`queued → running → (succeeded | failed | cancelled)`,终态不可逆(`cancel` 对终态任务是 no-op)。
- **取消语义**:`queued` 态取消直接置终态;`running` 态取消需 `taskkill /F /T` 杀整棵子进程树(仅 `child.kill()` 杀不掉 cmd 派生的 powershell/下载器孙进程)。
- **子进程构建**(`build_command`):`install`/`uninstall`/`update`/`bucket-add`/`bucket-remove` 经 `scoop::scoop_command`(即 `cmd /d /c scoop …`,注入 shims 目录到 PATH);`install-scoop` 直接起 `powershell -File <runner脚本>`。

## 6. 决策记录(append-only)

| ID | 日期 | 决策摘要 | 理由 |
| --- | --- | --- | --- |
| API01 | 2026-07-12 | `scoop_info` 返回二元组数组而非固定结构体 | `scoop info` 输出字段因包而异(如是否为 global 安装、是否有 notes),固定结构体无法覆盖;前端已按 key 做 i18n 回退,契约维持现状 |
| API02 | 2026-07-12 | 写操作一律不同步返回结果,统一走 `enqueue_job`/`install_scoop` + 事件流 | 安装/卸载/更新/桶增删/协助安装均为长耗时操作,同步等待会阻塞 UI;F17"安装任务进度反馈"要求可观察的中间进度,事件流是唯一满足该要求的形状 |
| API03 | 2026-07-16 | scoop config 读用直接读 `config.json`、写用 `scoop config` CLI,且三条命令均不入 InstallJob 队列 | 读文件一次拿全部当前值,避免解析 `scoop config` 无参输出的非表格键值;写走 CLI 让 scoop 处理布尔/数值类型转换与切分支等副作用;配置写入毫秒级完成,不属于 F17"长时任务"范畴,无需队列与进度事件 |

## 7. 文档范围声明

本文件只回答"IPC 命令的入参/返回/事件长什么样、由谁触发、错误如何表达"。不涉及:持久化数据的物理结构(见 db-doc)、页面如何编排这些命令的调用时序(见页面 PRD / developer 实现)、Scoop CLI 输出的文本解析规则细节(见 `src-tauri/src/parse.rs` 源码注释)。
