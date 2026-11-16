# 技术基线 · scoop-gui

> 文档层级:项目级契约(architect 产出,baseline / 0 号任务)
> 适用范围:scoop-gui 项目整体(唯一模块)
> 上游依赖:`docs/prd/project.md`、`docs/prd/modules/scoop-gui.md`
> 下游引用:全部模块的 db-doc / api-doc / design-system / developer 实现
> 真相源:`package.json`、`src-tauri/Cargo.toml`、`src-tauri/src/*`;如与本文档有出入,以代码为准

---

## 1. 技术栈选型

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 桌面运行时 | Tauri | 2.x |
| 后端语言 | Rust(edition 2021) | — |
| 前端框架 | React | 19.2 |
| 构建工具 | Vite | 8.x |
| 类型系统 | TypeScript | 5.8(`tsc --noEmit` 作为 build 前置检查) |
| UI 组件 | shadcn/ui(手写源码于 `src/components/ui/`,非 CLI 生成)+ Radix UI primitives | — |
| 样式 | Tailwind CSS | v4(`@theme` token,`@tailwindcss/vite` 插件) |
| 状态管理 | zustand | 5.x |
| 图标 | lucide-react | — |
| Toast | sonner | — |
| Rust 关键依赖 | `tauri-plugin-single-instance`(F18 单实例)、`serde`/`serde_json`(IPC 与持久化序列化)、`regex`(命令注入白名单校验) | — |

**选型理由**:本项目使用 Tauri 2 + React 19。Tauri 复用系统 WebView2,无需打包 Chromium;Rust 后端适合调用本机 `scoop` 命令行工具。

## 2. 实现层划分

产品以 Windows 桌面应用交付,内部按技术职责分为 Rust 后端和 React 前端:

| 端 | 目录 | 职责 |
| --- | --- | --- |
| `rust` | `src-tauri/src/` | Tauri IPC 命令实现、Scoop CLI 调用与输出解析、InstallJob 任务队列、本机持久化 |
| `web` | `src/` | React UI:页面、组件、状态管理、i18n、IPC 调用封装(`api.ts`) |

## 3. 进程与状态架构

- **单一共享状态 `Core`**(`lib.rs`):`settings: Mutex<Settings>`(本机持久化,见 db-doc)、
  `settings_persistence: Mutex<()>`(串行化设置快照写盘)、
  `scoop: Mutex<Option<ScoopEnv>>`(启动检测缓存的 Scoop 定位结果:版本、shims 目录)、
  `jobs: JobManager`(任务队列,见 api-doc 第 5 节)。这些状态通过 `Arc<Core>` 注入所有 Tauri 命令。
- **阻塞工作**:Tauri 同步命令在主线程执行；文件写入、Scoop 探测/查询、`taskkill` 等待、安装 runner 生成通过 `spawn_blocking` 执行。任务 worker 和 stdout/stderr reader 自己使用专用线程执行阻塞子进程 I/O。设置读取只在 app runtime 建立前的启动路径执行。
- **锁中毒策略**:`Core.settings`、`Core.settings_persistence`、`Core.scoop` 与 `JobManager.state` 使用 `std::sync::Mutex`，生产代码通过带明确理由的 `expect` fail-fast，不调用 `PoisonError::into_inner` 恢复。`settings`、`scoop`、`JobManager.state` 只保护短时内存状态更新/快照；唯一例外是设置文件写入会在 `spawn_blocking` 中持有单独的 `settings_persistence` 写入顺序锁,但已释放 `settings` 数据锁。panic 可能中断原地状态更新，恢复后继续使用无法证明一致的数据会让任务状态或设置错误，因此不恢复；`spawn_blocking` 中的 panic 由 Tauri 命令转换为 JoinError，job worker 中的 panic 会终止 worker。不要在这些锁保护区内加入 `.await`、子进程等待或用户可控回调。
- **长时写操作**:入队后立即返回 `id`,由单 worker 顺序执行,结果经 `job-changed`/`job-log` 事件流回传(见 api-doc 第 4 节)。Scoop 配置读写采用请求-响应命令,不进入 InstallJob。
- **单实例**(F18):`tauri-plugin-single-instance` 拦截二次启动,唤起并聚焦已运行窗口。

## 4. 关键架构决策与踩坑记录

以下决策对 developer 实现有约束力,具体机制见各自源码注释;PRD 层面的"为什么不做"见
`docs/prd/modules/scoop-gui.md` 第 5 节决策记录,本节只记录**技术实现**层面的决策。

| ID | 决策 | 理由 |
| --- | --- | --- |
| ARCH01 | `scoop` 经 `cmd /d /c scoop …` 调用,而非直接 `Command::new("scoop")` | `scoop` 是 `.cmd` shim,`std::process::Command` 不解析 `PATHEXT`;直接调用会因找不到可执行文件而失败 |
| ARCH02 | 定位到的 shims 目录**前置注入子进程 PATH**(而非依赖父进程环境变量) | 刚完成协助安装(F16)时,父进程(GUI 自身)的 PATH 快照仍是安装前的旧值;不这样做则装完 Scoop 后必须重启 GUI 才能用 |
| ARCH03 | 所有子进程带 `CREATE_NO_WINDOW`(`0x08000000`) | 防止调用 `cmd`/`powershell` 时出现黑色命令行窗口闪烁 |
| ARCH04 | Scoop 输出解析走"dash 分隔行起始位置 = 列起始位置",而非按空格切分或固定列宽 | Scoop 无 `--json`,表格由 PowerShell `Format-Table` 生成;dash 长度只等于表头词长、不等于列宽,按空格切分会打断含空格的列值(如 `Updated` 日期时间);详见 `parse.rs` 顶部注释 |
| ARCH05 | InstallJob 单 worker 顺序执行(非并发) | 与 `docs/prd/flows/scoop-gui.md` §2.4 状态机一致;Scoop 自身不保证并发写操作安全,顺序执行是最简单的正确实现 |
| ARCH06 | 取消执行中任务用 `taskkill /F /T /PID` 杀整棵进程树,并将启动/非零退出错误返回给调用方 | 子进程链为 `cmd → powershell → 下载器`,Rust 的 `child.kill()` 只杀 `cmd` 本身,子孙进程会成为孤儿继续运行;失败时不能把任务伪报为已取消 |
| ARCH07 | 协助安装的 PowerShell runner 脚本写盘带 UTF-8 BOM | PowerShell 5.1 无 BOM 时按系统 ANSI 代码页读取脚本,含中文路径/文案会乱码甚至解析失败 |
| ARCH08 | 提权安装(`RunAsAdmin`)走"外层 `Start-Process -Verb RunAs -Wait` 弹 UAC + 内层输出重定向落盘日志 + marker 文件传递退出码" | 提权子进程的 stdout/stderr 无法被非提权父进程直接捕获,只能靠文件中转 |
| ARCH09 | 命令入队前统一走白名单正则校验(`NAME_RE`/`REPO_RE`/`QUERY_RE`) | 包名/桶名/repo 地址最终拼入 `cmd` 参数,必须防止携带 shell 元字符造成命令注入 |
| ARCH10 | 单包写操作成功后只做单包刷新(`scoop list <name>`),不触发全量 `scoop status`/`list` | 全量检查更新仅由用户主动点击"检查更新"或首次进入触发;避免每次写操作后的隐式全量网络/磁盘开销 |
| ARCH11 | 同步 Tauri handler 不执行同步磁盘或进程等待;这类工作进 `spawn_blocking`，任务队列子进程则留在专用 worker | 同步 handler 在主线程运行;避免设置写盘、runner 生成、Scoop 探测/查询和 `taskkill` 等待冻结 UI |
| ARCH12 | Mutex poison 一律 fail-fast，不恢复 poisoned 状态 | panic 可能打断原地修改;拒绝继续读取/写入无法证明一致的 settings、Scoop 缓存或 job 状态 |

## 5. 目录结构

```
src-tauri/src/            ← Rust 后端
  commands.rs              全部 Tauri IPC 命令(api-doc 真相源)
  jobs.rs                  InstallJob 队列与状态机
  scoop.rs                 scoop 可执行文件定位与子进程构建
  parse.rs                 Scoop 文本输出解析
  installer.rs             协助安装 runner 脚本生成与提权处理
  settings.rs              本机持久化(db-doc 真相源)
  lib.rs / main.rs         应用入口、状态装配、IPC 注册

src/                       ← React 前端
  pages/                   启动与主流程视图;页面 PRD P01~P11 所指的业务能力分布在这些视图和跨页组件中
  components/              跨页面复用组件与 shadcn/ui 基础组件(components/ui/)
  store.ts                 zustand 全局状态与 Boot Sequence 编排
  api.ts                   IPC 调用封装(含浏览器 mock 降级)
  i18n.ts                  中英双语字典
  App.tsx                  启动分流与主流程宿主(P03);视图路由由 ViewId 管理,任务状态由全局状态协调
```

## 6. 文档范围声明

本文件只回答"整体技术栈是什么、端如何划分、进程状态怎么组织、有哪些不可违反的技术实现约束"。不涉及:具体数据结构(见 db-doc)、具体 IPC 契约细节(见 api-doc)、UI 视觉规范(见 design-system)、单个页面的交互细节(见页面 PRD)。
