# 贡献指南

> This guide is in Chinese to match the project's existing docs. English issues and PRs are welcome — feel free to write them in English.

感谢你对 scoopUI 感兴趣!在提交 Issue 或 PR 前,请花几分钟阅读本指南。

## 开发环境搭建

前置要求:

- [Rust](https://www.rust-lang.org/tools/install)(stable 工具链)
- [Node.js](https://nodejs.org) ≥ 20.19(或 ≥ 22.12)
- Windows 10/11(项目仅面向 Windows,依赖 WebView2 与 Scoop 本身的 Windows 语义)

```bash
git clone https://github.com/nvrenshiren/scoopUI.git
cd scoopUI
npm install
npm run tauri dev    # 开发模式,首次 Rust 编译约 10 分钟
```

仅需预览前端 UI(浏览器 mock 数据,无需 Rust 环境)时:

```bash
npm run dev           # http://localhost:5173
```

## 提交前自检

```bash
npm run build                  # tsc 类型检查 + vite 构建,必须无错误
cd src-tauri && cargo test     # Rust 单元测试(解析器 / 安装脚本生成),必须全部通过
```

这两步与 CI 工作流([.github/workflows/ci.yml](.github/workflows/ci.yml))完全一致,本地先跑通再提 PR 可以节省来回等待时间。

## 项目约定

在改动代码前,请先阅读:

- [CLAUDE.md](CLAUDE.md) — 架构要点、踩坑记录、关键设计约束(强烈建议先读,包含大量非显而易见的实现细节)
- [docs/prd/flows/scoop-gui.md](docs/prd/flows/scoop-gui.md) — 全部实体状态机的唯一真相源;涉及状态流转的改动必须先同步这里
- [docs/prd/modules/scoop-gui.md](docs/prd/modules/scoop-gui.md) — 功能清单与对应的 scoop CLI 命令
- [docs/design/systems/electron.md](docs/design/systems/electron.md) — 设计系统硬约束(暗色默认、run-green、组件形态等)

硬约束(PR 中不应违反):

- 软件源唯一性、单实例、仅中英双语、安装参数集边界 —— 详见 [docs/prd/project.md](docs/prd/project.md)
- 新增 UI 文案必须中英文成对出现,禁止只有一种语言
- 取消类操作使用中性灰(`variant="cancel"`),不得使用 destructive 红色语义
- 单包任务成功后只做单包刷新,不触发全局 `scoop status`/全量 list(详见 CLAUDE.md)

## 提交(Commit)规范

- commit message 用**中文**写,`type(scope):` 前缀(`feat`/`fix`/`docs`/`chore`/`refactor` 等 Conventional Commits 关键字)保留英文,例如 `fix(jobs): 修正取消任务未终止子进程树`
- 一个提交聚焦一件事,避免把无关的格式化改动混入功能提交
- 提交信息只描述改动本身,不要包含 AI 工具相关的署名或标注
- 英文 issue/PR 完全欢迎(见 README.en.md);仅 commit message 约定为中文

## Pull Request 流程

1. Fork 仓库并基于 `master` 创建分支
2. 完成改动后确保「提交前自检」两步均通过
3. 提交 PR,按照 PR 模板填写改动内容与测试情况
4. CI([ci.yml](.github/workflows/ci.yml))会自动跑类型检查、前端构建与 Rust 单测,请确保全部通过
5. 等待 review;根据反馈继续推送新提交即可,无需强制推送覆盖历史

## 报告 Bug / 提需求

请使用 Issue 模板([Bug 报告](.github/ISSUE_TEMPLATE/bug_report.yml) / [功能建议](.github/ISSUE_TEMPLATE/feature_request.yml)),尽量提供:

- 复现步骤、期望行为与实际行为
- scoopUI 版本、Windows 版本
- 涉及具体软件包/桶时请附上包名或桶名

## 代码风格

- TypeScript/React:遵循仓库现有风格(函数组件 + hooks、zustand 模块级 action、Tailwind 原子类),提交前用 `npm run build` 校验类型
- Rust:标准 `rustfmt` 格式(`cargo fmt`),新增解析/命令逻辑尽量附带基于真实 `scoop` 输出的单元测试
