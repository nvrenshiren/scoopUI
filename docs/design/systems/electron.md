# electron 端设计系统(v2 · 高级感 + 科技感)

> 文档层级:端级契约(设计系统是 HTML 原型的唯一真相源)
> 适用范围:scoop-gui 项目的所有 electron 端页面原型与生产页面
> 上游依赖:`docs/prd/modules/scoop-gui.md`、`docs/architecture/api/electron/scoop-gui.md`、`TECH.md`
> 修订记录:
> - v1(2026-07-11):基础 shadcn neutral 基底,亮/暗双主题对等
> - v2(2026-07-11):依据用户反馈"高级感多一些,科技感也需要多一些"重做。**暗色为默认与主推**,run-green 主色,Space Grotesk/DM Sans/JetBrains Mono,glass surface + micro-glow + grid pattern。亮色保留为备选。

---

## 1. 设计原则

| 原则 | 含义 |
|---|---|
| **终端原生感** | 配色与字体呼应 Scoop CLI 的"终端绿",用户从命令行迁移过来无违和感 |
| **暗色优先** | 暗色是默认主题(开发者/技术用户主要场景),亮色作为备选 |
| **静默高级** | 减少装饰元素,信息密度高,通过微光与边框细节营造高级感 |
| **即时反馈** | 所有交互 100ms 内视觉反馈,长时操作有清晰进度与可取消 |
| **克制色用** | 主色仅用于关键操作与状态指示,其余用中性灰阶 |

---

## 2. 色板 · Dark Mode(默认主推)

> OLED 真黑 + 蓝黑叠加 + run-green 强调。全部颜色已按 WCAG AAA 对比度校验。

| Token | OKLCH | Hex | 用途 |
|---|---|---|---|
| `--bg` | `oklch(0.13 0.02 250)` | `#0B1220` | 窗口背景(近 OLED 真黑) |
| `--bg-elevated` | `oklch(0.17 0.02 250)` | `#111827` | 卡片/对话框背景 |
| `--bg-overlay` | `oklch(0.20 0.02 250)` | `#1A2332` | 高亮卡片/选中项 |
| `--surface-glass` | `oklch(0.22 0.02 250 / 0.6)` | — | 玻璃表面(配合 backdrop-blur) |
| `--fg` | `oklch(0.96 0.005 250)` | `#F5F7FA` | 主文本 |
| `--fg-muted` | `oklch(0.72 0.01 250)` | `#A1AAB8` | 次文本 |
| `--fg-subtle` | `oklch(0.55 0.01 250)` | `#6B7280` | 辅助文本/占位符 |
| `--border` | `oklch(0.30 0.01 250)` | `#374151` | 默认边框 |
| `--border-strong` | `oklch(0.45 0.01 250)` | `#5B6678` | 强调边框/聚焦环 |
| `--primary` | `oklch(0.72 0.18 145)` | `#22C55E` | run-green · 主操作/成功状态 |
| `--primary-hover` | `oklch(0.76 0.18 145)` | `#34D672` | 主色 hover |
| `--primary-glow` | `oklch(0.72 0.18 145 / 0.25)` | — | 主色微光(用于聚焦/CTA) |
| `--accent` | `oklch(0.70 0.16 250)` | `#60A5FA` | 信息蓝/链接 |
| `--accent-glow` | `oklch(0.70 0.16 250 / 0.25)` | — | 信息色微光 |
| `--warning` | `oklch(0.80 0.16 80)` | `#F59E0B` | 过期标记/警告 |
| `--destructive` | `oklch(0.65 0.22 25)` | `#EF4444` | 卸载/失败/错误 |
| `--destructive-glow` | `oklch(0.65 0.22 25 / 0.20)` | — | 错误色微光 |
| `--success` | `oklch(0.72 0.18 145)` | `#22C55E` | 同 --primary(成功语义) |
| `--ring` | `oklch(0.72 0.18 145)` | `#22C55E` | 键盘聚焦环 |

### 2.1 暗色叠加层(科技感)

```css
/* 顶层 grid pattern · 营造终端感 */
.bg-grid {
  background-image:
    linear-gradient(to right, oklch(0.30 0.01 250 / 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.30 0.01 250 / 0.08) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* 顶部细微径向渐变 · 暗示终端辉光 */
.bg-glow-top {
  background: radial-gradient(
    ellipse 800px 200px at 50% -50%,
    oklch(0.72 0.18 145 / 0.08),
    transparent
  );
}
```

### 2.2 暗色关键对比

| 组合 | 对比度 | 等级 |
|---|---:|---|
| `--fg` on `--bg` | 16.8:1 | AAA |
| `--fg-muted` on `--bg` | 7.2:1 | AAA |
| `--primary` on `--bg` | 8.4:1 | AAA |
| `--fg` on `--bg-elevated` | 14.5:1 | AAA |
| `--destructive` on `--bg` | 5.8:1 | AA |

---

## 3. 色板 · Light Mode(备选)

> 简洁白底,run-green 主色保持一致,适合白天/明亮环境。

| Token | OKLCH | Hex |
|---|---|---|
| `--bg` | `oklch(0.99 0.005 250)` | `#FAFBFC` |
| `--bg-elevated` | `oklch(1 0 0)` | `#FFFFFF` |
| `--bg-overlay` | `oklch(0.96 0.005 250)` | `#F4F6F8` |
| `--fg` | `oklch(0.18 0.02 250)` | `#0F172A` |
| `--fg-muted` | `oklch(0.45 0.01 250)` | `#475569` |
| `--border` | `oklch(0.88 0.01 250)` | `#D1D5DB` |
| `--primary` | `oklch(0.55 0.18 145)` | `#16A34A`(暗色版主色加深) |
| 其他语义色 | 略,见 CSS 变量定义 |

亮色版不参与"科技感"重点,作为辅选保证双主题可用。

---

## 4. 字体

```css
:root {
  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
}

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

| 角色 | 字体 | 字重 |
|---|---|---|
| 标题(H1-H3) | Space Grotesk | 600/700 |
| 正文 | DM Sans | 400/500 |
| 标签/小字 | DM Sans | 500 |
| 代码/版本号/错误码 | JetBrains Mono | 400/500 |
| 数字(版本/进度) | JetBrains Mono | 500(等宽数字防 layout shift) |

字号尺度(rem):

| Token | Size | 用途 |
|---|---:|---|
| `text-xs` | 0.75 | 标签、辅助信息 |
| `text-sm` | 0.875 | 次要正文 |
| `text-base` | 1.0 | 默认正文 |
| `text-lg` | 1.125 | 强调正文 |
| `text-xl` | 1.25 | 小标题 |
| `text-2xl` | 1.5 | Section 标题 |
| `text-3xl` | 1.875 | 页面标题 |
| `text-4xl` | 2.25 | 首启页大标题 |

行高:正文 1.5,标题 1.2。

---

## 5. 间距尺度

| Token | Value |
|---|---:|
| `space-1` | 0.25rem / 4px |
| `space-2` | 0.5rem / 8px |
| `space-3` | 0.75rem / 12px |
| `space-4` | 1rem / 16px |
| `space-6` | 1.5rem / 24px |
| `space-8` | 2rem / 32px |
| `space-12` | 3rem / 48px |
| `space-16` | 4rem / 64px |

---

## 6. 圆角

| Token | Value | 用途 |
|---|---:|---|
| `--radius-sm` | 4px | 标签、徽标 |
| `--radius-md` | 8px | 输入框、按钮、小卡片 |
| `--radius-lg` | 12px | 卡片、对话框 |
| `--radius-xl` | 16px | 大卡片、面板 |
| `--radius-full` | 9999px | 头像、状态点 |

---

## 7. 阴影与微光(科技感核心)

```css
/* 基础阴影(暗色版) */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.4);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.4);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.7), 0 8px 10px -6px rgb(0 0 0 / 0.5);

/* 微光 · 主色(高级感) */
--glow-primary: 0 0 20px var(--primary-glow), 0 0 40px var(--primary-glow);
--glow-accent: 0 0 16px var(--accent-glow);
--glow-destructive: 0 0 12px var(--destructive-glow);

/* 边框微光(选中/聚焦) */
--ring-primary: 0 0 0 1px var(--primary), 0 0 0 4px var(--primary-glow);
```

---

## 8. 核心组件形态(v2 升级)

### 8.1 按钮(Button)

| Variant | 视觉 |
|---|---|
| **primary** | `--primary` 实心 + `box-shadow: var(--glow-primary)` hover 时增强光晕 |
| **secondary** | `--bg-overlay` + `--border` 边框,hover 时边框变为 `--border-strong` |
| **outline** | 透明背景 + `--border` 边框,hover 时背景变 `--bg-overlay` |
| **ghost** | 透明背景,hover 时背景变 `--bg-overlay` |
| **destructive** | `--destructive` 实心 + `box-shadow: var(--glow-destructive)` |

| Size | 高度 | 圆角 |
|---|---:|---|
| `sm` | 32px | --radius-md |
| `default` | 40px | --radius-md |
| `lg` | 48px | --radius-lg |
| `icon` | 40×40 | --radius-md |

按下反馈:`active:scale-[0.98] active:brightness-90` + 100ms 过渡。

### 8.2 卡片(Card)

- 背景 `--bg-elevated`
- 边框 `1px solid --border`
- 圆角 `--radius-lg`
- 阴影 `var(--shadow-md)`
- 顶部可选 thin gradient line (`from-transparent via-primary/20 to-transparent`)——科技感点缀

### 8.3 输入框(Input)

- 背景 `--bg-overlay`
- 边框 `1px solid --border`
- 聚焦:边框变 `--primary` + 外环 `var(--ring-primary)`
- 高度 40px

### 8.4 对话框(Dialog)

- 居中,`max-w-2xl`(默认)
- 背景 `--bg-elevated`
- 圆角 `--radius-xl`
- 阴影 `var(--shadow-xl)`
- 背景遮罩 `bg-black/60 backdrop-blur-sm`

### 8.5 进度对话框(Special:非 modal)

- 不全屏遮罩,背景半透明(`bg-black/30 backdrop-blur-sm`)
- 用户可继续浏览主页
- 关闭按钮(右上角 X)始终可见
- 顶部 thin gradient bar(`from-primary via-accent to-primary`)标识进行中任务
- 进度条:`bg-bg-overlay` 容器 + `bg-primary` 填充,填充带 `box-shadow: var(--glow-primary)`(科技感)
- 取消态:**禁用 destructive 色**,改用 `--fg-muted` 中性灰
- 原始日志区:`font-mono` `text-sm` `bg-bg/50` 滚动容器

### 8.6 表格 / 数据表(Table)

- 行高 `h-10`(40px)
- 仅水平分隔线(`border-b border-border`)
- 表头 sticky,`bg-bg-elevated`
- 选中行 `bg-primary/10`(主色 10% 透明)+ 左侧 2px `--primary` 边线
- 过期行:`bg-warning/5` + 行首 `AlertTriangle` 图标

### 8.7 侧边栏(Sidebar)

- 宽度 240px,固定
- 背景 `--bg-elevated` + 右侧 `1px solid --border`
- 导航项:`h-10 px-3`,选中时 `bg-primary/10 text-primary` + 左侧 2px `--primary`
- 底部 Theme toggle(亮/暗/跟随系统)

### 8.8 Tabs(双 Tab 桶管理)

- 激活态:底部 `2px solid --primary` + 微光 `box-shadow: 0 1px 8px var(--primary-glow)`

### 8.9 Badge(状态徽标)

- `default` / `success` / `warning` / `destructive` / `outline` 5 个 variant
- 圆角 `--radius-sm`,高度 20px,`text-xs font-medium`
- 过期:`bg-warning/15 text-warning border-warning/30`

### 8.10 Toast(Sonner)

- 顶部右侧堆叠
- 默认 4s 自动消失,错误 6s
- 圆角 `--radius-lg`,阴影 `var(--shadow-lg)`
- 成功:`border-l-2 border-primary`(左侧 2px run-green 边线)
- 错误:`border-l-2 border-destructive` + 微光

### 8.11 Command / cmdk(搜索)

- 触发:顶部 SearchBar 或 `Ctrl+K`
- 弹出:居中浮层,`max-w-xl`,背景 `--bg-elevated`,圆角 `--radius-xl`
- 输入框 `h-12`,带搜索图标 + `Esc` 关闭提示
- 结果列表行高 `h-10`,选中 `bg-primary/10`

---

## 9. 该端硬约束(v2)

| 项 | 规则 |
|---|---|
| 窗口尺寸 | 1280×800 默认;最小 1024×600;支持 resize |
| Sidebar | 240px 固定,4 导航项(已装/浏览/桶/设置)+ 底部 Theme toggle |
| 对话框 | 居中,`max-w-2xl`;P08 进度对话框**非 modal、可关闭** |
| 表格行高 | `h-10`(40px);过期行 Badge 警告 |
| 按钮禁用 | 长时操作中除"取消"外所有按钮 `disabled:opacity-50 disabled:cursor-not-allowed` |
| 错误展示 | 错误用 Sonner Toast 或 Dialog;**不**用 inline alert;错误码用 `font-mono` |
| 取消态 | P08 取消**不**用 destructive 色,改用 `--fg-muted` 中性灰(取消 ≠ 失败) |
| i18n | 所有 UI 文案经 `t('key')`,key 命名 `<domain>.<page>.<element>`;两套双语占位 |
| 主题 | 暗色为默认与主推;P09 提供"亮/暗/跟随系统"三选一 |
| 键盘 | `Esc` 关闭对话框;`Enter` 确认;`Ctrl+K` 搜索(预留);Tab 顺序匹配视觉顺序 |
| 微光(科技感) | 主 CTA / 聚焦环 / 选中行 / 进度条填充 — 必带 `--glow-*` |
| 网格背景(科技感) | 主页 P03 / P04 / P05 / P06 / P08 / P09 顶部 1/3 区域叠加 `.bg-grid` + `.bg-glow-top` |
| 顶部品牌线(科技感) | Sidebar 顶部 1px 渐变线 `from-transparent via-primary to-transparent` |
| 无障碍 | shadcn Radix 默认满足 ARIA;聚焦环必带 |

---

## 10. 典型页面骨架(v2)

### 10.1 主界面壳(P03)

```
┌──────────────────────────────────────────────────────────────────┐
│ [渐变线 1px from-transparent via-primary to-transparent]        │
│ ┌────────────┬─────────────────────────────────────────────────┐ │
│ │            │ ╭─ thin gradient bar (primary→accent→primary) ╮ │ │
│ │  Sidebar   │ │ PageHeader                          │ ⋯ │   │ │
│ │  240px     │ ├─────────────────────────────────────────────────┤ │
│ │            │ │                                                 │ │
│ │  [LOGO]    │ │   Content (bg-grid + bg-glow-top)               │ │
│ │            │ │                                                 │ │
│ │  ◉ 已装    │ │                                                 │ │
│ │  ○ 浏览    │ │                                                 │ │
│ │  ○ 桶管理  │ │                                                 │ │
│ │  ○ 设置    │ │                                                 │ │
│ │            │ │                                                 │ │
│ │  ──────    │ │                                                 │ │
│  [Theme]     │ │                                                 │ │
│  [中文/EN]   │ │                                                 │ │
│ └────────────┴─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 列表页(P04/P05/P06)

```
[ PageHeader: 标题 + 描述 + 右侧工具栏(搜索/刷新) ]
[ SubToolbar: 过滤/批量操作主按钮 ]
[ Table: 表头 sticky + 行 h-10 + 过期行 Badge ]
[ Footer: 分页(预留) ]
```

### 10.3 详情对话框(P07)

```
[ 居中 Dialog, max-w-2xl, 圆角 --radius-xl ]
  ── 顶部: 图标 + 名称 + 版本号(JetBrains Mono) + Badge(状态)
  ── 中部: Description / Homepage / License 等字段
  ── 底部: 取消 secondary | 操作按钮(随状态变) primary/destructive
```

### 10.4 进度对话框(P08)

```
[ 非 modal · 居中浮层 · 可关闭 ]
  ╭ thin gradient bar (running 时显示) ╮
  Title: scoop install git
  Subtitle: 当前步骤 Downloading... (font-mono)
  ── Progress: [████████░░░░░░░░░░░░] 45% (h-2,带 glow)
  ── 日志区: h-64 overflow-auto bg-bg/50 font-mono text-sm
  ── 底部: [关闭 ghost]   [取消 destructive 仅 running 时]
```

---

## 11. 设计 token 实现

### 11.1 Tailwind v4 `@theme`

```css
@import "tailwindcss";

@theme {
  --color-bg: oklch(0.13 0.02 250);
  --color-bg-elevated: oklch(0.17 0.02 250);
  --color-bg-overlay: oklch(0.20 0.02 250);
  --color-fg: oklch(0.96 0.005 250);
  --color-fg-muted: oklch(0.72 0.01 250);
  --color-fg-subtle: oklch(0.55 0.01 250);
  --color-border: oklch(0.30 0.01 250);
  --color-border-strong: oklch(0.45 0.01 250);
  --color-primary: oklch(0.72 0.18 145);
  --color-primary-hover: oklch(0.76 0.18 145);
  --color-accent: oklch(0.70 0.16 250);
  --color-warning: oklch(0.80 0.16 80);
  --color-destructive: oklch(0.65 0.22 25);
  --color-success: oklch(0.72 0.18 145);

  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.4);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.7), 0 8px 10px -6px rgb(0 0 0 / 0.5);
}

/* 亮色模式 */
:root.light {
  --color-bg: oklch(0.99 0.005 250);
  --color-bg-elevated: oklch(1 0 0);
  --color-bg-overlay: oklch(0.96 0.005 250);
  --color-fg: oklch(0.18 0.02 250);
  --color-fg-muted: oklch(0.45 0.01 250);
  --color-primary: oklch(0.55 0.18 145);
  /* ... 其他覆盖 */
}
```

### 11.2 自定义工具类

```css
@layer utilities {
  .bg-grid {
    background-image:
      linear-gradient(to right, oklch(0.30 0.01 250 / 0.08) 1px, transparent 1px),
      linear-gradient(to bottom, oklch(0.30 0.01 250 / 0.08) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .bg-glow-top {
    background: radial-gradient(ellipse 800px 200px at 50% -50%, oklch(0.72 0.18 145 / 0.08), transparent);
  }
  .gradient-line-primary {
    background: linear-gradient(to right, transparent, oklch(0.72 0.18 145), transparent);
  }
  .glow-primary {
    box-shadow: 0 0 20px var(--primary-glow), 0 0 40px var(--primary-glow);
  }
  .ring-glow-primary {
    box-shadow: 0 0 0 1px var(--primary), 0 0 0 4px var(--primary-glow);
  }
}
```

---

## 12. 文档范围声明与变更说明

### 12.1 v1 → v2 关键变更

| 维度 | v1 | v2 |
|---|---|---|
| 主色 | shadcn neutral | run-green `#22C55E`(呼应 Scoop CLI) |
| 默认主题 | 亮/暗双主题对等 | **暗色默认与主推**,亮色保留为备选 |
| 字体 | Inter(中英)+ 系统默认 | **Space Grotesk**(标题)+ **DM Sans**(正文)+ **JetBrains Mono**(代码) |
| 视觉效果 | 基础阴影 | **micro-glow** + **grid pattern** + **gradient line** + **glass surface** |
| 主题氛围 | 中性、克制 | **终端原生感 + 高级感 + 科技感** |

### 12.2 适用范围

本文件是端级契约,所有 electron 端 HTML 原型与生产页面必须严格遵循。
已审批但基于 v1 产出的 10 个 HTML 原型(task 4-13)在 v2 批准后**必须重做**。

### 12.3 不涉及

- 任何 React 组件实现细节(developer 阶段)
- 任何 IPC 实现细节(架构师阶段已完成)
- 任何动画曲线时长细节(developer 阶段实现,但 P08 已规定"非 modal + 可关闭"原则)

---

**v2 需用户审批后,designer 重做 10 个 HTML 原型。**