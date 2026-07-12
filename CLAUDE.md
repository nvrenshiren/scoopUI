# scoop-gui 项目说明(供 AI 协作与新成员)

Windows 桌面应用:Scoop 包管理器的图形化前端。**Rust(Tauri 2)+ React 19 + Vite 8 + shadcn/ui + Tailwind CSS v4**(用户指定的前端栈,勿换回其它框架)。状态管理 zustand,toast 用 Sonner,图标 lucide-react。

## 契约文档(改功能前必读)

- `docs/prd/project.md` — 项目范围与硬约束(软件源唯一性 / 单实例 / 仅中英双语 / 安装参数集边界)
- `docs/prd/flows/scoop-gui.md` — **全部实体状态机的唯一真相源**(App / Scoop 自身 / Bucket / InstallJob / UI Language / Boot Sequence);任何状态流转改动先改这里
- `docs/prd/modules/scoop-gui.md` — 功能清单 F01~F19、页面清单 P01~P10、每个功能对应的 scoop CLI 命令
- `docs/design/systems/electron.md` — 设计系统 v2(暗色默认、run-green、字体、组件形态硬约束);文件名带 electron 是历史原因,实际交付为 Tauri

## 常用命令

```bash
npm run tauri dev     # 开发(热更新);首次 Rust 编译约 10 分钟
npm run tauri build   # NSIS 安装包 → src-tauri/target/release/bundle/nsis/
npm run dev           # 仅前端(浏览器 mock 模式,无需 Rust)
npm run build         # vue-tsc 类型检查 + vite 构建(CI 前必过)
cd src-tauri && cargo test   # 解析器/安装脚本单测(基于真实 scoop 0.5.3 输出样例)
```

## 架构要点与踩坑记录

### Rust 侧(src-tauri/src/)

- **scoop 调用方式**(`scoop.rs`):`scoop` 是 `.cmd` shim,`std::process::Command` 不解析 PATHEXT,必须经 `cmd /d /c scoop …` 调用;定位到的 shims 目录**前置注入子进程 PATH**,这样刚装完 Scoop(父进程 PATH 是旧快照)无需重启 GUI 即可调用 —— F15/F16 安装后复检依赖此行为。所有子进程带 `CREATE_NO_WINDOW`(0x08000000)防黑窗闪烁。
- **输出解析**(`parse.rs`):scoop 无 `--json`。表格是 PowerShell Format-Table:**dash 分隔行每段的起始位置 = 列起始位置**(dash 长度只等于表头词长,不等于列宽),按段起点切列即可正确处理含空格的值(Updated 日期)与右对齐数字列(Manifests)。改解析先跑真机输出对样例。
- **任务队列**(`jobs.rs`):单 worker 顺序执行(InstallJob 状态机:排队中→执行中→已成功/已失败/已取消)。取消必须 `taskkill /F /T /PID` 杀整棵树(cmd→powershell→下载器),`child.kill()` 只杀 cmd。行内 `\r` 进度重绘取最后一段。
- **协助安装**(`installer.rs`):生成 runner.ps1 下载并执行官方 install.ps1。**RunAsAdmin 勾选走提权路径**:外层 `Start-Process -Verb RunAs -Wait` 弹 UAC,内层输出 `*>>` 落盘日志 + marker 文件传退出码(提权进程 stdout 接不回来)。PS 脚本写盘带 UTF-8 BOM(PowerShell 5.1 无 BOM 按 ANSI 读,中文路径会坏)。
- **批量更新**(F08)实现为前端逐个 enqueue `scoop update <app>`(每对象一条 InstallJob),与 flow §1.6 状态机吻合,而非 `scoop update *`。
- 命令入队前用白名单正则校验包名/桶名/repo(防 cmd 元字符注入)。

### 前端(src/)

- `api.ts`:无 `__TAURI_INTERNALS__` 时自动降级 mock(浏览器可预览全部 UI 与任务流)。
- `store.ts`(zustand):Boot Sequence 编排(检测语言偏好→检测 Scoop→主界面/协助安装)、job 事件(`job-changed`/`job-log`)、"安装中/更新中/卸载中"等实体瞬态由**进行中任务推导**(`selectBusyTargets`)。动作是模块级函数(`useApp.setState`),组件用 selector + `useMemo` 取派生值。
- **单包任务成功后只做单包刷新**(用户明确要求):install/update/uninstall 成功 → `refreshApp(name)`(`scoop list <name>`,子串匹配需精确名过滤)+ 本地移除该包的过期条目;**不得**触发全局 `scoop status`/全量 list。全局检查更新仅由用户点"检查更新"按钮或首次进入时触发。
- 任务进度浮层(P08,`JobsPanel.tsx` 自绘非 modal)点击外部时**优先关闭面板并吞掉该次点击**(pointerdown+click 双 capture 拦截),不与底层 UI 交互;radix portal 对话框与 sonner toast 例外。
- i18n:`i18n.ts` 单文件双语字典 + zustand `store.lang` 驱动重渲(组件调 `useLang()`);禁止出现只有一种语言的文案(项目硬约束);新增 UI 文案必须 zh/en 成对;`scoop info` 动态字段名走 `tf("detail.field."+key, key)` 回退。
- 设计 token:`index.css` 的 Tailwind v4 `@theme`,设计系统色映射到 shadcn 语义变量(background/card/primary/…),扩展 `info`(信息蓝)/`warning`/`subtle`/`border-strong`;亮色用 `:root.light` 覆盖变量(非 shadcn 惯例的 `.dark` 类,因暗色是默认)。shadcn 组件在 `components/ui/`(手写源码,非 CLI 生成)。
- 取消按钮用 `<Button variant="cancel">`(中性灰),**不得**用 destructive 色(取消≠失败,设计系统硬约束)。
- 表格用 `TableWrap`(overflow-x hidden,不出横向滚动条);来源桶经 `bucketNameOf()` 规范化(manifest 路径 → 桶名,title 保留原值)。

### 调试技巧

- 真窗口远调:`tauri.conf.json` window 加 `"additionalBrowserArgs": "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --remote-debugging-port=9223"`,然后 CDP 连 `http://127.0.0.1:9223/json/list`(WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS 环境变量在此场景不生效)。**验证后必须移除**,不得进发布配置。
- Git Bash 里测 cmd 开关要写 `cmd //d //c`(POSIX 路径转换会吃掉 `/c`)。
- 用户配置持久化在 `%APPDATA%\scoop-gui\config.json`(language/theme/installConfig)。

## 状态

MVP 阶段一(F01~F19)已实现并通过:cargo test 9/9、vue-tsc、真机端到端(67 个已装包/35 过期真实渲染、单实例、语言切换)。未做(PRD 明确排除):自动更新计划、备份还原、托盘通知、scoop config 编辑、shims 管理。
