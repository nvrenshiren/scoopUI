# scoopUI 项目说明

Windows 桌面应用:Scoop 包管理器的图形化客户端。前端使用 React 19、TypeScript、Vite、shadcn/ui 与 Tailwind CSS v4;Tauri 2 / Rust 负责本机命令与设置持久化。

## 契约与设计来源

- `docs/prd/project.md` — 产品范围、平台与硬约束。
- `docs/prd/flows/scoop-gui.md` — 业务流程与实体状态机。
- `docs/prd/modules/scoop-gui.md` — 功能与页面清单。
- `docs/prd/pages/web/scoop-gui/` — 页面行为契约。
- `docs/architecture/api/scoop-gui.md`、`docs/architecture/database/scoop-gui.md` — IPC 与本机设置契约。
- `ARCHITECTURE.md` — Rust/前端边界、锁与阻塞操作约定。
- `docs/design/systems/web.md` — COHESION 2.0 接入与本应用当前视觉约定。

代码和配置是实现现状的依据;契约变更时同步更新对应文档,不要在多个文件复制状态机定义。

## 开发与检查

```bash
npm ci
npm run tauri dev
npm run dev
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
cargo check --manifest-path src-tauri/Cargo.toml --locked
cargo test --manifest-path src-tauri/Cargo.toml --locked
```

Rust 使用 edition 2021、最低版本 1.88。CI 在 Windows 执行格式、Clippy、编译、测试与前端构建门禁。

## 实现约定

### Rust 与 Scoop

- `scoop` 是 `.cmd` shim,经 `cmd /d /c scoop …` 调用;将已定位的 shims 目录前置注入子进程 `PATH`。所有子进程禁用控制台窗口。
- Scoop 表格解析依据 dash 分隔行确定列起点,实现与样例在 `src-tauri/src/parse.rs`。
- 写操作通过单 worker 顺序执行。取消执行中任务用 `taskkill /F /T /PID` 结束进程树;PID 未登记或终止失败时返回错误。
- Scoop 安装通过 `src-tauri/src/installer.rs` 生成的 PowerShell runner;提权路径使用落盘日志与退出码 marker。
- 命令参数经 `commands.rs` 白名单校验。配置文件 I/O、Scoop 查询、`taskkill` 等等待与 runner 生成必须在 `spawn_blocking` 或专用 worker 中运行。
- Core 与任务状态的 mutex poison 按架构文档 fail-fast,不恢复无法证明一致的状态。
- F20 读取 Scoop 的 `config.json`,写入通过 `scoop config`;该请求不进入长时任务队列。`private_hosts` 只读呈现,复杂值不经 UI 序列化写回。

### 前端与设计系统

- 所有界面文案在 `src/i18n.ts` 维护中英文对照;主题和组件使用 COHESION 生成 token。
- 单包安装/更新/卸载成功后只刷新对应软件包;完整更新检查由用户主动触发或启动流程触发。
- F08 批量更新由前端逐包入队,不调用 `scoop update *`。
- 设计 token 快照位于 `src/theme/`;需要更新时执行 `npm run sync:cohesion`,并从 `D:\Work\dawi\design` 或配置的 `COHESION_DESIGN_ROOT` 读取共享源码。

## CI 与发布

- `.github/workflows/ci.yml` 是本地门禁命令的依据;项目当前只支持 Windows。
- `.github/workflows/release.yml` 对 `master` 上的代码变更自动递增补丁版本并创建版本化 Release;纯 Markdown 与 `docs/` 变更跳过发布。版本来源是 `package.json`,Cargo 版本与锁文件由发布流程同步。
- 发布产物为 NSIS 安装程序与免安装 zip;流程细节以工作流文件为准,避免在本文维护易过时的操作记录。

## 当前范围

F01–F20 均在当前产品范围内,包括 Scoop 配置页。自动更新计划、备份还原、系统托盘/通知、shims 管理及额外语言暂不支持。
