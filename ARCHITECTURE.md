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

**选型理由**(项目历史决策,见 `CLAUDE.md`):本项目最初以 Electron 技术方向规划(部分文档路径历史遗留 `electron` 命名),后**整体重写为 Tauri 2 + React 19**——Tauri 复用系统 WebView2、无需打包 Chromium,安装包更小,且 Rust 后端天然适合本产品"调用本机 `scoop` 命令行工具"的场景。

## 2. 端(endpoint)划分

opcflow 坐标系的"端"在本项目按**技术实现面**划分为两端,与 `project.md` 第 4 节"端清单"(业务交付形态,只有一个 Windows 桌面端)是不同维度——业务上只有一个可交付产品,技术上前后端代码分属两个可独立验收的实现面:

| 端 | 目录 | 职责 |
| --- | --- | --- |
| `rust` | `src-tauri/src/` | Tauri IPC 命令实现、Scoop CLI 调用与输出解析、InstallJob 任务队列、本机持久化 |
| `web` | `src/` | React UI:页面、组件、状态管理、i18n、IPC 调用封装(`api.ts`) |

## 3. 进程与状态架构

- **单一共享状态 `Core`**(`lib.rs`):`settings: Mutex<Settings>`(本机持久化,见 db-doc)、
  `scoop: Mutex<Option<ScoopEnv>>`(启动检测缓存的 Scoop 定位结果:版本、shims 目录)、
  `jobs: JobManager`(任务队列,见 api-doc 第 5 节)。三者通过 `Arc<Core>` 注入所有 Tauri 命令。
- **读命令**:`spawn_blocking` 执行同步子进程调用,避免阻塞 async runtime。
- **写命令**:一律不同步等待,入队后立即返回 `id`,执行结果经 `job-changed`/`job-log` 事件流回传(见 api-doc 第 4 节)。
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
| ARCH06 | 取消执行中任务用 `taskkill /F /T /PID` 杀整棵进程树 | 子进程链为 `cmd → powershell → 下载器`,Rust 的 `child.kill()` 只杀 `cmd` 本身,子孙进程会成为孤儿继续运行 |
| ARCH07 | 协助安装的 PowerShell runner 脚本写盘带 UTF-8 BOM | PowerShell 5.1 无 BOM 时按系统 ANSI 代码页读取脚本,含中文路径/文案会乱码甚至解析失败 |
| ARCH08 | 提权安装(`RunAsAdmin`)走"外层 `Start-Process -Verb RunAs -Wait` 弹 UAC + 内层输出重定向落盘日志 + marker 文件传递退出码" | 提权子进程的 stdout/stderr 无法被非提权父进程直接捕获,只能靠文件中转 |
| ARCH09 | 命令入队前统一走白名单正则校验(`NAME_RE`/`REPO_RE`/`QUERY_RE`) | 包名/桶名/repo 地址最终拼入 `cmd` 参数,必须防止携带 shell 元字符造成命令注入 |
| ARCH10 | 单包写操作成功后只做单包刷新(`scoop list <name>`),不触发全量 `scoop status`/`list` | 全量检查更新仅由用户主动点击"检查更新"或首次进入触发;避免每次写操作后的隐式全量网络/磁盘开销 |

## 5. 目录结构与 codeRoots 映射

```
src-tauri/src/            ← rust 端(codeRoots: src-tauri/src/{module}.rs)
  commands.rs              全部 Tauri IPC 命令(api-doc 真相源)
  jobs.rs                  InstallJob 队列与状态机
  scoop.rs                 scoop 可执行文件定位与子进程构建
  parse.rs                 Scoop 文本输出解析
  installer.rs             协助安装 runner 脚本生成与提权处理
  settings.rs              本机持久化(db-doc 真相源)
  lib.rs / main.rs         应用入口、状态装配、IPC 注册

src/                       ← web 端(codeRoots: src/{module}、src/{module}.ts(x))
  pages/                   页面级组件(对应页面 PRD P01~P10)
  components/              跨页面复用组件与 shadcn/ui 基础组件(components/ui/)
  store.ts                 zustand 全局状态与 Boot Sequence 编排
  api.ts                   IPC 调用封装(含浏览器 mock 降级)
  i18n.ts                  中英双语字典
  App.tsx                  主界面壳(对应 P03)
```

## 6. 文档范围声明

本文件只回答"整体技术栈是什么、端如何划分、进程状态怎么组织、有哪些不可违反的技术实现约束"。不涉及:具体数据结构(见 db-doc)、具体 IPC 契约细节(见 api-doc)、UI 视觉规范(见 design-system)、单个页面的交互细节(见页面 PRD)。
