# scoop-gui 项目说明(供 AI 协作与新成员)

Windows 桌面应用:Scoop 包管理器的图形化前端。**Rust(Tauri 2)+ React 19 + Vite 8 + shadcn/ui + Tailwind CSS v4**(用户指定的前端栈,勿换回其它框架)。状态管理 zustand,toast 用 Sonner,图标 lucide-react。

## 契约文档(改功能前必读)

- `docs/prd/project.md` — 项目范围与硬约束(软件源唯一性 / 单实例 / 仅中英双语 / 安装参数集边界)
- `docs/prd/flows/scoop-gui.md` — **全部实体状态机的唯一真相源**(App / Scoop 自身 / Bucket / InstallJob / UI Language / Boot Sequence);任何状态流转改动先改这里
- `docs/prd/modules/scoop-gui.md` — 功能清单 F01~F20、页面清单 P01~P11、每个功能对应的 scoop CLI 命令
- `docs/design/systems/web.md` — 设计系统 v2(暗色默认、run-green、字体、组件形态硬约束)
- `ARCHITECTURE.md` — 技术基线(架构决策 ARCH01~10);`docs/architecture/database/scoop-gui.md` — 本机持久化结构;`docs/architecture/api/scoop-gui.md` — 17 条 Tauri IPC 命令契约
- `docs/acceptance/web/scoop-gui/P01~P11.md` — 每页 QA 验收标准(含与实际实现的已知偏差记录)

## 常用命令

```bash
npm run tauri dev     # 开发(热更新);首次 Rust 编译约 10 分钟
npm run tauri build   # NSIS 安装包 → src-tauri/target/release/bundle/nsis/
npm run dev           # 仅前端(浏览器 mock 模式,无需 Rust)
npm run build         # tsc 类型检查 + vite 构建(CI 前必过)
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
- **Scoop 配置读写**(`config.rs` + `commands.rs` 的 `scoop_config_*`,F20):读直接读 `%USERPROFILE%\.config\scoop\config.json`(XDG_CONFIG_HOME 优先)一次拿全,不解析 CLI;写走 `scoop config <k> <v>` / `scoop config rm <k>` 让 scoop 处理布尔/数值类型转换与切分支副作用;这三条命令**不入 InstallJob 队列**(毫秒级同步操作);key 走 32 项白名单 `CONFIG_KEYS`、value 走 `CONFIG_VALUE_RE` 防注入。

### 前端(src/)

- `api.ts`:无 `__TAURI_INTERNALS__` 时自动降级 mock(浏览器可预览全部 UI 与任务流)。
- `store.ts`(zustand):Boot Sequence 编排(检测语言偏好→检测 Scoop→主界面/协助安装)、job 事件(`job-changed`/`job-log`)、"安装中/更新中/卸载中"等实体瞬态由**进行中任务推导**(`selectBusyTargets`)。动作是模块级函数(`useApp.setState`),组件用 selector + `useMemo` 取派生值。
- **单包任务成功后只做单包刷新**(用户明确要求):install/update/uninstall 成功 → `refreshApp(name)`(`scoop list <name>`,子串匹配需精确名过滤)+ 本地移除该包的过期条目;**不得**触发全局 `scoop status`/全量 list。全局检查更新仅由用户点"检查更新"按钮或首次进入时触发。
- 任务进度浮层(P08,`JobsPanel.tsx` 自绘非 modal)点击外部时**优先关闭面板并吞掉该次点击**(pointerdown+click 双 capture 拦截),不与底层 UI 交互;radix portal 对话框与 sonner toast 例外。
- i18n:`i18n.ts` 单文件双语字典 + zustand `store.lang` 驱动重渲(组件调 `useLang()`);禁止出现只有一种语言的文案(项目硬约束);新增 UI 文案必须 zh/en 成对;`scoop info` 动态字段名走 `tf("detail.field."+key, key)` 回退。
- 设计 token:`index.css` 的 Tailwind v4 `@theme`,设计系统色映射到 shadcn 语义变量(background/card/primary/…),扩展 `info`(信息蓝)/`warning`/`subtle`/`border-strong`;亮色用 `:root.light` 覆盖变量(非 shadcn 惯例的 `.dark` 类,因暗色是默认)。shadcn 组件在 `components/ui/`(手写源码,非 CLI 生成)。
- 取消按钮用 `<Button variant="cancel">`(中性灰),**不得**用 destructive 色(取消≠失败,设计系统硬约束)。
- 表格用 `TableWrap`(overflow-x hidden,不出横向滚动条);来源桶经 `bucketNameOf()` 规范化(manifest 路径 → 桶名,title 保留原值)。
- **Scoop 配置页**(P11,`ConfigView.tsx` + `scoopConfig.ts`,F20):32 项 `scoop config` 按 6 类分区,控件按类型映射(bool→自绘 `Switch`、enum→Button 段选、number/string→Input、secret→password+显隐、private_hosts→只读展示);改一项即时写入(`store.ts` 的 `setScoopConfigItem` 乐观更新,失败回滚 + toast),恢复默认走 `resetScoopConfigItem`(`scoop config rm`);目录类危险项(root/global/cache_path)写入/恢复前 `ConfirmDialog` 确认;新增 UI 文案照例 zh/en 成对(`config.*` 键)。

### 调试技巧

- 真窗口远调:`tauri.conf.json` window 加 `"additionalBrowserArgs": "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --remote-debugging-port=9223"`,然后 CDP 连 `http://127.0.0.1:9223/json/list`(WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS 环境变量在此场景不生效)。**验证后必须移除**,不得进发布配置。
- Git Bash 里测 cmd 开关要写 `cmd //d //c`(POSIX 路径转换会吃掉 `/c`)。
- 用户配置持久化在 `%APPDATA%\scoop-gui\config.json`(language/theme/installConfig)。

### CI/CD(.github/workflows/)

- 项目仅面向 Windows,`ci.yml`/`release.yml` 均跑在 `windows-latest`(`cargo test` 与 `tauri build`/NSIS 打包都依赖 Windows,不能换成 ubuntu-latest)。
- `release.yml` 在每次 push 到 `master` 时(纯 `docs/**` / `**/*.md` / `.claude/**` 改动经 `paths-ignore` 跳过,不触发构建与版本递增;混合代码改动仍触发)跑完整 `npm run tauri build`,以 `v<version>` **版本化 tag** 发布独立 Release —— 每次 master 提交对应 Releases 列表里一条新记录:`gh release create "v${version}" --target <该次自动递增后的 sha>`,附带 NSIS 安装包与免安装绿色版 zip 两种资产;不带 `--prerelease`,由 GitHub 自动把最新版标为 Latest。版本号来自 `package.json`(由本 workflow 的 `npm version patch` 自动递增),故每次 tag 唯一、不冲突。**权衡**:每次 master 提交都会 bump + 发一条 `v0.1.x`,Releases 列表会随提交持续累积——这是从早期"滚动 `latest` 预发布"改为版本化后的已知取舍(用户明确选择版本化每版一条记录);若日后只想让人工正式版进列表,应改为按需触发(打 tag / `workflow_dispatch`)而非每次 push 自动发。旧的滚动 `latest` release/tag 需在 GitHub 网页端手动删除一次(改版后不再更新它)。
- 用的是默认 `GITHUB_TOKEN`,不是 fine-grained PAT:这个 workflow 由人工 push 触发,只做"构建 + 发布 release",不会再触发下游 workflow,不属于全局规则里"bot 推送/合并需要 RELEASE_TOKEN"那种下游 workflow 联动场景。
- 每次发布同时附带两个产物:NSIS 安装包(`bundle/nsis/*.exe`)与免安装绿色版 zip(`scoopUI-portable-x64.zip`)。Tauri 官方 `bundle.targets` 在 Windows 上只有 `nsis`/`msi` 两种安装包目标,**没有内置的 portable 选项**;绿色版是 `release.yml` 里额外加的一步——把 `tauri build` 顺带产出的裸 `target/release/*.exe`(NSIS 打包前的原始可执行文件)连同同目录的 `WebView2Loader.dll` 一起 `Compress-Archive` 打包,本机装了 WebView2 Runtime(Win11 自带)即可解压直接运行,无需安装、不写注册表。
- **版本号单一来源 + 自动递增**:`tauri.conf.json` 的 `version` 字段设为 `"../package.json"`(Tauri 官方支持的写法,指向 package.json 而非写死数字),之后只有 `package.json` 一处需要维护版本号,`src-tauri/Cargo.toml` 的 `[package] version` 靠 `release.yml` 里的 `sed` 保持同步。`release.yml` 在 `cargo test` 之后、`tauri build` 之前跑 `npm version patch --no-git-tag-version` 把 patch 位 +1,连同 Cargo.toml 一起提交并 `git push origin HEAD:master`——用默认 `GITHUB_TOKEN` 推送,这次 push **不会**再触发 `release.yml`(GitHub 对 `GITHUB_TOKEN` 触发的事件有内置防循环,详见全局规则),不会死循环。发布用的 `--target` 与 release notes 里的提交号都改成指向这次自动递增后的新提交,而不是触发 workflow 那次的原始 `github.sha`。

## 状态

MVP 阶段一(F01~F19)已实现并通过:cargo test 9/9、tsc、真机端到端(67 个已装包/35 过期真实渲染、单实例、语言切换)。阶段一后追加 **F20 · Scoop 配置可视化编辑**(P11 `ConfigView`,见模块 PRD 决策 D13):32 项 `scoop config` 分类即时读写,`cargo check` + `npm run build` + 浏览器 mock 预览均已验证。未做(PRD 明确排除):自动更新计划、备份还原、托盘通知、shims 管理。

## opcflow 工作流集成

项目已接入 opcflow(`workbench.config.json`,`endpoints: [rust, web]`,`.workbench/` 为本地任务库,已 gitignore)。全部契约文档(project/roles/glossary/flow/module-prd/page-prd×10/design-system/db-doc/api-doc/acceptance×10)与 code 目录已 `scan` 登记 + `submit` 送审,等待人工在 `opcflow serve` 或 CLI 里 approve;10 个页面原型待 👍(design-system 升级到 v2 后原有原型已重做)。改契约文档后记得 `opcflow scan` 重新登记。

**倒填流程(补齐既有实现的验收/架构文档)时发现并已修复的实现缺口**(源码已改,`npm run build` 与浏览器 mock 模式均已验证):

- P01:`BootView.tsx` 提交安装配置前新增 `validate()` 校验(路径非法字符、代理地址格式、代理凭据冲突/不全),不通过则标红对应字段 + toast 提示,不再直接进入安装。
- P01/P08:`store.ts` 的 `startInstallScoop()` 现在同时置位 `jobsPanelOpen: true`,F16 协助安装的 InstallJob 会出现在 P08 任务面板(BootView 自身的进度区保留,两者并存)。
- P04/P07:单包更新新增二次确认(`ConfirmDialog`),与卸载/批量更新一致;"已装列表为空"与"过滤后零匹配"拆分为 `installed.empty` / `installed.noMatch` 两套文案。
- P04/P05:表格行加 `tabIndex`/`role="button"`/回车-空格键盘触发,纯键盘用户可从列表进入详情。
- P06:`refreshBuckets()` 改用 `Promise.allSettled` 分别请求"已添加桶"与"已知桶清单",各自独立记录 `errors.buckets` / `errors.knownBuckets`,已知桶清单读取失败不再被吞掉、也不再和"确实为空"共用文案。
- i18n:删除死键 `lang.title/subtitle/zh/en`(`LanguagePick.tsx` 全程未走 i18n 字典,文案是组件内硬编码)、`installed.noOutdated`;`common.retry` 接入 P07 详情读取失败态的重试按钮。

修复前的完整发现记录仍保留在各页 `docs/acceptance/web/scoop-gui/P0x.md` 的"已知实现细节"章节,包含更多次要的设计系统措辞差异(未改代码,如 P02 标题字号、P03 侧边栏底部插槽等),供后续按需处理。
