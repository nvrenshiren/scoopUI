# P11 · 设计提示词 · Scoop 配置页

> 文档层级:页面级产出(designer · 仅登记不送审)
> 适用范围:web 端 scoop-gui 模块 P11
> 上游依赖:`docs/prd/pages/web/scoop-gui/P11-Scoop配置页.md`、`docs/design/systems/web.md`
> 下游引用:`docs/design/prototypes/web/scoop-gui/P11-Scoop配置页.html`
> 真相源标注:本提示词的分区结构、控件形态与文案口径以 `src/pages/ConfigView.tsx`、`src/scoopConfig.ts`、`src/store.ts`、`src/i18n.ts` 为准;第 9 节据实登记其与上游 PRD 的出入,不改写上游契约文件。

---

## 1. 页面定位

P11 不是独立页,而是 P03 主界面壳内的路由态(`view: "config"`),由侧边栏第 5 个导航项"Scoop 配置"(图标 `Wrench`,位于"桶管理"与"设置"之间)切换进入,与其它视图对等承载于同一个 `<main>` 容器——**不是** Dialog/Modal。设计时必须呈现完整壳层上下文(240px Sidebar + 主区)。

页面职责对应 F20(Scoop 配置可视化编辑)+ F19(错误处理)。它编辑的是 **Scoop 自身**(`scoop config`)的运行时配置,与 P09 设置页编辑的"本产品自有的语言/主题/安装配置"是两套独立数据——设计上不要把两者混在同一页,也不要在本页出现语言/主题切换。

## 2. 布局骨架(1280×800 全壳上下文)

```text
┌──────────────────────────────────────────────────────────────────┐
│ [1px 渐变线]                                                      │
│ ┌────────────┬─────────────────────────────────────────────────┐ │
│ │ Sidebar    │ [bg-grid + bg-glow-top 叠加]                     │ │
│ │ 240px      │  Scoop 配置 (text-2xl font-heading)              │ │
│ │ [LOGO]     │  管理 Scoop 自身的全部配置项…(text-[13px])       │ │
│ │ ◯ 已装     │ ─────────────────────────────────────────────── │ │
│ │ ◯ 浏览     │  分区卡片 1 · 下载器(aria2 7 项)                │ │
│ │ ◯ 桶管理   │  分区卡片 2 · 网络与代理(2 项)                  │ │
│ │ ● Scoop 配置│  分区卡片 3 · 更新策略(7 项)                    │ │
│ │ ◯ 设置     │  分区卡片 4 · 安装与工具(11 项)                 │ │
│ │  flex-1    │  分区卡片 5 · 目录(3 项,危险)                  │ │
│ │ ◯ 任务     │  分区卡片 6 · 令牌与密钥(2 项)                  │ │
│ │            │  (6 张卡片纵向堆叠,max-w-[820px],mb-3)          │ │
│ └────────────┴─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

侧边栏第 5 项"Scoop 配置"呈选中态(`active`:`bg-primary-glow-soft` + `text-primary` + 左内嵌 2px primary),其余导航项常态。标题区与 P09/其它页同构(`bg-grid` + `bg-glow-top`,标题 `text-2xl font-heading`,副标题 `text-[13px] text-muted-foreground`)。

## 3. 分区卡片与配置行结构

- 6 张分区卡片复用同一形态:`bg-card`、`border border-border`、`rounded-lg`、`shadow-[var(--shadow-md)]`、`max-w-[820px]`、`mb-3`、内 padding 20px。卡片头部:图标(`text-primary` 18px)+ 标题(`font-heading text-sm font-semibold`)+ 说明(`text-xs text-muted-foreground`)。分区图标固定:下载器 `Download`、网络与代理 `Globe`、更新策略 `RefreshCw`、安装与工具 `Wrench`、目录 `HardDrive`、令牌与密钥 `KeyRound`。
- 卡片内每个配置项是一行(`flex items-start justify-between`,`py-3`,行间 `border-b border-border/60`,末行无边框):
  - **左列**(`flex-1`):业务名称(`text-[13px] font-medium`,危险项名称后接"谨慎"warning badge)→ 一句说明(`text-xs text-muted-foreground`)→ 原始键名(`font-mono text-[10px] text-subtle`,可 `select-text`,如 `aria2-enabled`)。
  - **右列**(`shrink-0 flex items-center gap-2`):值控件(见第 4 节)+ 已设置项额外的"恢复默认"图标按钮(`RotateCcw`,`ghost`/`iconSm`,`text-subtle`)。

## 4. 控件形态规范(按配置类型)

| 类型 | 控件 | 形态要点 |
| --- | --- | --- |
| bool | 拨动开关 Switch | 项目无 radix Switch,自绘:轨道 `h-5 w-9 rounded-full`,开=`bg-primary`、关=`bg-[var(--border-strong)]`,白色滑块 `size-4` 位移;未设置项按 schema 默认值决定初始态 |
| enum | 候选值段选按钮组 | 每个候选一个 `sm` Button;选中值 `variant=default`(实心 run-green),其余 `variant=outline`。如 `scoop_branch`(master/develop)、`default_architecture`(64bit/32bit/arm64)、`shim`(kiennq/scoopcs/71) |
| number | 数字输入框 | `Input type=number`,窄(`w-28`),placeholder 为默认值(如 5) |
| string | 文本输入框 | `Input`,`w-64`,placeholder 为默认值(如 `5M`、仓库 URL、路径) |
| secret | 密码输入 + 显隐切换 | `Input type=password`(默认遮罩)+ `Eye`/`EyeOff` `ghost iconSm` 切换按钮;仅 `gh_token`、`virustotal_api_key` |
| readonly | 只读文本 | 仅 `private_hosts`:`font-mono text-xs text-subtle` 展示当前值或"未设置",无编辑控件 |

段选与开关不用额外图标;控件整体右对齐。全页**不设**整页"保存/应用"按钮——每项独立即时生效(见第 7 节)。

## 5. 目录类危险项(root_path / global_path / cache_path)

- 名称后接 warning badge("谨慎"/"Caution",`badge-warning` 形态)。
- 修改值(或恢复默认)时,**先弹确认对话框**再写入:标题"修改目录配置"/"Change directory setting",正文说明"{名称} 只会修改 Scoop 配置,不会搬移已安装的软件包或缓存。改错可能导致 Scoop 找不到已装应用。确定继续吗?",确认按钮"仍然修改"/"Change anyway"(用 `default` 而非 destructive——这是谨慎而非破坏),取消按钮"取消"。对话框复用 P04/P06 同款 `ConfirmDialog`(radix Dialog,`w-[min(480px,…)]`)。

## 6. 敏感令牌(gh_token / virustotal_api_key)

- 默认以密码形态遮罩,右侧 `Eye`/`EyeOff` 切换明文/遮罩。
- 视觉上不额外强调,但设计与实现都不得让令牌值出现在遮罩之外的任何地方(不落日志、不外传);令牌仅经 `scoop config` 写入本机。

## 7. 即时写入 / 恢复默认 / 失败反馈

- **即时写入**:开关拨动、段选点击后立即写入;文本/数值/令牌输入框在**失焦或回车**时写入(草稿态未失焦不写)。写入采用乐观更新(界面先反映新值),后台 `scoop config` 落盘。
- **清空即恢复默认**:文本类输入清空后失焦,等同"恢复默认"(`scoop config rm`)。
- **恢复默认**:仅"已显式设置过"的项显示 `RotateCcw` 按钮;点击移除该项、回到默认态(危险项同样先确认)。
- **写入失败**:该项**回滚**到写入前的值,并弹 info/error 级 Toast("保存失败:…"/"Save failed: …");不停留在错误的乐观态。
- **读取失败**:配置整体读不到时,主区展示错误提示卡(`border-destructive/40` + `text-destructive`),不白屏。

## 8. 交互场景矩阵(对齐页面 PRD §4)

| 场景 | 触发 | 页面应呈现 |
| --- | --- | --- |
| 查看全部 | 进入 P11 | 6 分区卡片按序展开,各项按当前值回填;已设置项带"恢复默认" |
| 开关切换 | 拨动某 bool 项 | 开关即时反映新态,该项随即出现"恢复默认" |
| 枚举切换 | 点另一候选值 | 选中值高亮切换 |
| 文本编辑 | 输入后失焦/回车 | 以新值写入;清空→恢复默认 |
| 危险项修改 | 改目录项 | 先弹确认框,确认后才写入 |
| 令牌编辑 | 编辑令牌 | 默认遮罩,可切换显示 |
| 写入失败 | 某项写入失败 | 该项回滚 + 失败 Toast |

## 9. 与上游文档的口径差异(据实登记,不改写上游文件)

1. **`private_hosts` 采用只读降级**:页面 PRD 说"覆盖全部配置项",但 `private_hosts` 是对象数组,经 `scoop config` CLI 传复杂结构易出错,`ConfigView.tsx` 将其设为 `control: "readonly"`——只读展示当前值 + 提示走命令行编辑,其余 31 项完整可视化读写。原型据此实现口径设计。
2. **写入值格式交由 scoop**:前端统一以字符串经 `scoop config <k> <v>` 写入,布尔/数值的落库类型由 scoop 负责(api-doc 决策 API03),读回时按 JSON 原值展示。
3. **无整页保存按钮**:本页是逐项即时生效模型,不设"保存/应用",与 P09 语言/主题的即时生效模型一致。

## 10. i18n 文案 key 对照(全部取自 `src/i18n.ts`)

- 导航/页头:`nav.config`、`config.title`、`config.desc`。
- 分区标题/说明:`config.cat.<download|network|update|tools|paths|secret>.title` / `.desc`。
- 每项名称/说明:`config.item.<key>.label` / `.help`(如 `config.item.aria2-enabled.label`);key 含连字符者原样(如 `aria2-max-connection-per-server`)。
- 交互:`config.reset`、`config.toggleShow`、`config.notSet`、`config.saveFailed`、`config.loadFailed`、`config.dangerBadge`、`config.dangerTitle`、`config.dangerDesc`、`config.dangerConfirm`。
- 全部 zh/en 成对(项目硬约束);配置项名称/说明随界面语言切换,原始键名(`aria2-enabled` 等)与枚举候选值字面量(`64bit`/`master`/`kiennq` 等)不译。

## 11. 文档范围声明

本文件只回答"P11 应该长什么样、控件如何分组、交互态如何呈现",供 HTML 原型与后续复核使用。不涉及:业务流程与状态机定义(唯一出处 `docs/prd/flows/scoop-gui.md`)、功能与页面清单的模块级归属(唯一出处 `docs/prd/modules/scoop-gui.md`)、IPC 契约细节(唯一出处 `docs/architecture/api/scoop-gui.md`)、设计系统 token 定义(唯一出处 `docs/design/systems/web.md`)。第 9 节登记的口径差异仅供后续评审参考,不构成对上述任何契约文件的修改。
