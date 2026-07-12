# 系统架构

> 文档层级:项目级技术契约(基线)
> 适用范围:scoop-gui 项目整体
> 上游依赖:docs/prd/{project,roles,glossary}.md / docs/prd/flows/scoop-gui.md / docs/prd/modules/scoop-gui.md / docs/prd/pages/electron/scoop-gui/P01-P10.md(全部 approved)
> 下游引用:developer(基于此实现)/ qa(基于此验证架构符合性)

---

## 1. 项目结构总览

```
scoopUI/
├── electron.vite.config.ts          # 三进程构建配置
├── electron-builder.yml             # 打包配置
├── ARCHITECTURE.md                  # 本文件
├── TECH.md                          # 硬约束清单
├── tsconfig.json                    # 渲染端 TS 配置
├── tsconfig.node.json               # 主进程 + preload TS 配置
├── components.json                  # shadcn 配置
├── package.json
├── src/
│   ├── main/                        # 主进程
│   │   ├── index.ts                 # app.whenReady,创建窗口
│   │   ├── window-manager.ts
│   │   ├── app-lifecycle.ts         # 单实例锁、退出
│   │   ├── ipc-router.ts            # 注册所有 handle
│   │   └── services/
│   │       ├── scoop-service.ts     # 门面
│   │       ├── command-runner.ts    # child_process 封装 + 流
│   │       ├── parsers.ts           # scoop 输出解析
│   │       └── types.ts
│   ├── preload/
│   │   ├── index.ts                 # contextBridge.exposeInMainWorld
│   │   └── api.ts                   # 共享类型
│   ├── renderer/                    # React 应用
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                  # Router + Providers
│   │   ├── routes/
│   │   ├── features/
│   │   │   ├── apps/
│   │   │   └── buckets/
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn 生成
│   │   │   ├── layout/
│   │   │   └── theme-provider.tsx
│   │   ├── lib/
│   │   └── stores/
│   └── shared/                      # 主/渲染两端共享
│       ├── ipc-contract.ts          # 通道名 + zod schema
│       ├── progress.ts
│       ├── enums.ts                 # 共享枚举(只有 architect 能改)
│       └── messages.ts              # i18n 消息(zod 校验)
├── tests/
│   ├── main/
│   └── renderer/
└── docs/
    ├── architecture/
    │   ├── api/electron/scoop-gui.md
    │   └── database/scoop-gui.md    # 数据契约(本项目无关系数据库)
    ├── design/
    ├── prd/
    └── acceptance/
```

---

## 2. 进程拓扑

```
┌─────────────────────────────────────────────────────────────┐
│  Main Process (Node, TS)                                    │
│  ├─ window-manager: BrowserWindow 创建/恢复                │
│  ├─ scoop-service: 唯一与 scoop CLI 通信的模块             │
│  │   ├─ command-runner: child_process.spawn + 行缓冲       │
│  │   └─ parsers: 解析 scoop list/search/status 等输出       │
│  ├─ ipc-router: ipcMain.handle + zod 校验                  │
│  └─ app-lifecycle: app.requestSingleInstanceLock           │
└────────────────▲────────────────────────────────────────────┘
                 │ contextBridge (window.api.*)
                 │ contextIsolation=true, nodeIntegration=false
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Preload (CJS, TS)                                          │
│  └─ exposeInMainWorld('api', ScoopApi)                       │
└────────────────▲────────────────────────────────────────────┘
                 │ window.api.* (Promise<T>)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Renderer (React 19, Vite, shadcn/ui)                       │
│  ├─ ipc-client: window.api 包装为 TanStack Query            │
│  ├─ stores (Zustand): UI 状态                               │
│  ├─ routes (react-router v7): 10 个页面                     │
│  └─ components: shadcn/ui 组合                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 核心数据流

### 3.1 读操作(列表/搜索/详情)

```
renderer(组件)
  → useApps() hook(TanStack Query)
  → window.api.apps.listInstalled()
  → preload(invoke 'scoop:apps:listInstalled')
  → ipcMain.handle 校验(zod)+ 调 scoop-service
  → command-runner.runScoop(['list'])
  → child_process.spawn('scoop', ['list'])
  → parsers.parseList(stdout)
  → 返回 AppInfo[]
  → preload → renderer → React 渲染
```

### 3.2 写操作(安装/卸载/更新/桶管理)

```
renderer(组件)点击"安装"
  → useInstallApp() mutation
  → window.api.apps.install(input)
  → preload(invoke 'scoop:apps:install', 订阅进度事件 'scoop:apps:install:progress')
  → ipcMain.handle 启动 job
  → spawn('scoop', ['install', name])
  → 行缓冲读取 → 正则匹配 → ProgressChunk
  → webContents.send('scoop:apps:install:progress', { jobId, chunk })
  → preload 转发 → renderer useProgress(jobId) hook
  → UI 进度条更新
  → 进程退出 → 关闭事件 → preload Promise resolve
```

### 3.3 单实例约束

```
用户双击 scoop-gui.exe
  → app.requestSingleInstanceLock()
  → 第一次:返回 true → 创建 BrowserWindow
  → 第二次:返回 false → app.quit()(无窗口创建)
  → 主进程监听 'second-instance' 事件
  → 已运行实例收到事件 → 唤起/聚焦现有窗口
```

---

## 4. 关键模块边界

| 模块 | 职责 | 不做什么 |
|---|---|---|
| `scoop-service` | 编排 scoop 命令调用,返回业务对象 | 不懂窗口、不直接 IPC |
| `command-runner` | child_process 封装 + 流式行缓冲 | 不解析内容、不懂 scoop |
| `parsers` | 把 stdout/stderr 解析为业务对象 | 不执行命令 |
| `ipc-router` | 注册 ipcMain.handle + zod 校验 | 不懂 scoop 命令细节 |
| `window-manager` | 创建/恢复/聚焦窗口 | 不懂 scoop |
| `app-lifecycle` | 单实例锁、退出钩子 | 不懂窗口 |
| `preload/api` | contextBridge 暴露 window.api | 不做业务逻辑 |
| `features/*` hooks | TanStack Query 封装 IPC | 不直接调 window.api(经 lib/ipc-client) |

---

## 5. 打包与发布

- **构建**:electron-vite 三进程分别构建
- **打包**:electron-builder
- **产物格式**:
  - `scoop-gui-Setup-x.y.z.exe`(NSIS 安装器,推荐主分发)
  - `scoop-gui-x.y.z-portable.exe`(免安装便携版,可选)
- **代码签名**:本项目 MVP 不强求,后续阶段再考虑(留接口)

---

## 6. i18n 架构(待用户决策)

### 候选方案

| 方案 | 优点 | 缺点 |
|---|---|---|
| **A. i18next + react-i18next**(推荐) | 生态成熟、ICU MessageFormat、原生 TS 支持、按需懒加载 | bundle 略大(~30KB) |
| **B. 自定义 zod-typed messages** | 零依赖、类型完整、bundle 小 | 缺复数/插值内置支持、要自己写工具函数 |
| **C. lingui** | 编译时提取、bundle 最小 | 学习曲线、macro 配置复杂 |

**推荐 A**(理由:本项目文案量预计 > 200 条,i18next 的命名空间、插值、复数内置支持能省下大量胶水代码)。

### 文案组织

```
src/shared/messages/
├── zh-CN.json        # 中文
├── en-US.json        # 英文
└── index.ts          # 类型导出 + key 约束
```

key 命名:`<domain>.<page>.<element>`,例:`apps.install.button.confirm`。

---

## 7. 持久化设计

### 7.1 preferences.json

路径:`app.getPath('userData')/preferences.json`(Windows 通常 `%APPDATA%/scoop-gui/preferences.json`)。

schema(zod 校验):

```ts
const PreferencesSchema = z.object({
  uiLanguage: z.enum(['zh-CN', 'en-US']),
  onboardingCompleted: z.boolean(),
  scoopInstallConfig: z.object({
    scoopDir: z.string(),
    scoopGlobalDir: z.string().optional(),
    scoopCacheDir: z.string().optional(),
    noProxy: z.boolean(),
    proxy: z.string().optional(),
    proxyCredential: z.object({ username: z.string(), password: z.string() }).optional(),
    proxyUseDefaultCredentials: z.boolean(),
    runAsAdmin: z.boolean(),
  }).optional(),
  windowBounds: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
});
```

写入策略:启动时读 → zod 校验 → 失败回退默认 → 修改时 deep merge 后写。

### 7.2 不持久化的数据

- Scoop 版本(`scoop --version` 实时探测)
- Scoop 安装路径(`where scoop` 实时探测)
- 桶列表、已装列表、可装列表(`scoop list/status/bucket list` 实时拉取)
- 长时操作进度(进程退出即丢)

---

## 8. 错误处理策略

### 8.1 IPC 错误统一形态

```ts
type IPCResult<T> = { ok: true; data: T } | { ok: false; error: IPCError };
interface IPCError {
  code: string;        // E_<DOMAIN>_<ACTION>_<REASON>
  message: string;     // 业务可读消息(根据 i18n key)
  cause?: unknown;     // 原始错误,仅用于日志
}
```

### 8.2 错误码命名规范

`E_<DOMAIN>_<ACTION>_<REASON>`,例如:
- `E_SCOOP_NOT_FOUND`(未检测到 scoop)
- `E_SCOOP_INSTALL_TIMEOUT`(安装超时)
- `E_SCOOP_INSTALL_FAILED`(scoop 自身退出非 0)
- `E_SCOOP_PARSE_FAILED`(输出无法解析)
- `E_PREFERENCES_INVALID`(本地持久化损坏)
- `E_IPC_INVALID_INPUT`(IPC 入参 zod 校验失败)

详细枚举见 `src/shared/enums.ts`(本轮暂不创建,后续 task 由 architect 维护)。

### 8.3 已知错误分类

| 类别 | 处理 |
|---|---|
| 命令不存在(scoop 没装) | 引导走 P01 协助安装 |
| 网络失败 | 重试 + 提示用户检查代理 |
| 权限不足(全局目录) | 提示需要管理员 |
| 用户取消 | 静默关闭进度 |
| 未知错误 | 展示错误码 + 原始消息 + 日志查看入口 |

---

## 9. IPC 契约总览

完整契约见 `docs/architecture/api/electron/scoop-gui.md`(task 2 产出)。通道清单预览:

| 通道 | 方向 | 说明 |
|---|---|---|
| `scoop:onboarding:check` | renderer→main | 检测 scoop 是否可用 |
| `scoop:onboarding:install` | renderer→main | 启动 scoop 安装,带进度事件 |
| `scoop:apps:listInstalled` | renderer→main | 已装列表 |
| `scoop:apps:search` | renderer→main | 搜索 |
| `scoop:apps:info` | renderer→main | 单包详情 |
| `scoop:apps:status` | renderer→main | 过期检查 |
| `scoop:apps:install` | renderer→main | 安装(进度事件 `scoop:apps:install:progress`) |
| `scoop:apps:uninstall` | renderer→main | 卸载(进度事件 `scoop:apps:uninstall:progress`) |
| `scoop:apps:update` | renderer→main | 更新(进度事件 `scoop:apps:update:progress`) |
| `scoop:buckets:list` | renderer→main | 已添加桶 |
| `scoop:buckets:known` | renderer→main | 已知桶 |
| `scoop:buckets:add` | renderer→main | 添加桶(进度事件 `scoop:buckets:add:progress`) |
| `scoop:buckets:remove` | renderer→main | 移除桶(进度事件 `scoop:buckets:remove:progress`) |
| `scoop:prefs:get` | renderer→main | 读 preferences |
| `scoop:prefs:set` | renderer→main | 写 preferences |

---

## 10. 测试架构

### 10.1 单元测试(vitest)

- `parsers.test.ts`:正则解析全部 scoop 命令输出,含样本与反例
- `command-runner.test.ts`:mock spawn 验证行缓冲、超时、错误处理
- `preferences.test.ts`:zod schema 校验 + 损坏回退
- `ipc-router.test.ts`:zod 校验失败拒绝入参

### 10.2 集成测试(可选 MVP+)

- 真实环境跑 `scoop list`(需保证测试机已装 scoop),验证解析器实际输出
- 不进入 CI 必跑,留给本地手动

### 10.3 组件测试(@testing-library/react)

- P04 已装列表渲染
- P08 进度对话框的进度更新

### 10.4 E2E(本项目 MVP 不做)

留待后续阶段。

---

## 11. 未来阶段预留接口

| 能力 | 预留位置 |
|---|---|
| 自动更新检查计划 | `scoop-service` 增加 `getUpdateSchedule` / `setUpdateSchedule`,UI 在 P09 留设置项 |
| 备份还原 | `scoop-service` 增加 `exportApps` / `importApps`,UI 留入口 |
| 托盘 | `app-lifecycle` 增加 `Tray` 创建,`window-manager` 增加 `hideToTray` |
| 配置编辑 | `scoop:config:*` 通道,UI 在 P09 增加 |
| shims 管理 | `scoop:shim:*` 通道,UI 新增 P11 |

---

## 12. 待用户决策项(基线审批时一并确认)

1. **i18n 方案**:A(i18next 推荐)/ B(自定义) / C(lingui)
2. **持久化格式**:JSON(zod,推荐)/ SQLite
3. **错误处理库**:zod + 自定义 ErrorCode(推荐)/ neverthrow
4. **打包形态**:NSIS only / NSIS + portable
5. **代码签名**:本阶段不签 / 自签名(测试用)
6. **TypeScript 配置**:strict 全开(推荐) / 关闭 exactOptionalPropertyTypes

---

## 13. 建议的 `workbench.config.json` protocolLints(待用户确认)

```jsonc
[
  "package.json 中依赖不得使用 'latest'",
  "renderer/components/ 下文件必须为 PascalCase.tsx",
  "renderer 端不得直接 import 'electron'(只通过 preload 暴露的 window.api)",
  "ipcMain.handle 处理器返回值必须符合 IPCResult<T> 类型",
  "src/shared/enums.ts 之外不得使用魔法字符串表示状态值",
  "preload 不得包含业务逻辑(只暴露 typed wrapper)"
]
```