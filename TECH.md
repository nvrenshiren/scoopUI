# 技术基线 · 硬约束清单

> 文档层级:项目级硬约束(machine-checkable)
> 适用范围:scoop-gui 项目所有源码
> 上游依赖:ARCHITECTURE.md

---

## 1. TypeScript 配置

### 1.1 编译器选项(`tsconfig.json` 渲染端)

- `"strict": true`
- `"noUncheckedIndexedAccess": true`
- `"exactOptionalPropertyTypes": true`
- `"noImplicitOverride": true`
- `"noFallthroughCasesInSwitch": true`
- `"verbatimModuleSyntax": true`
- `"moduleResolution": "Bundler"`
- `"target": "ES2022"`
- `"jsx": "react-jsx"`

### 1.2 `tsconfig.node.json`(主进程 + preload)

- 与渲染端共享严格选项
- `"module": "ESNext"`(由 electron-vite 编译为 CJS)
- `"types": ["node", "electron"]`

### 1.3 类型风格

- 优先 `type` 而非 `interface`(除非要扩展)
- 联合类型显式标注
- 禁止 `any`,必要时 `unknown` + 收窄

---

## 2. 目录与命名约定

### 2.1 目录

- 全小写 + 连字符(单层目录可单词,如 `lib`、`stores`)
- 例:`features/apps/hooks/use-installed-apps.ts`

### 2.2 文件

| 类型 | 命名 | 示例 |
|---|---|---|
| React 组件 | `PascalCase.tsx` | `AppList.tsx` |
| Hook | `kebab-case.ts`(前缀 use-) | `use-installed-apps.ts` |
| 工具/服务 | `kebab-case.ts` | `command-runner.ts` |
| 类型/常量 | `kebab-case.ts` | `ipc-contract.ts` |
| 测试 | `<name>.test.ts(x)` | `parsers.test.ts` |
| 配置文件 | `kebab-case.config.ts` | `electron-vite.config.ts` |

### 2.3 标识符

| 类型 | 命名 | 示例 |
|---|---|---|
| 类型 | `PascalCase` | `AppInfo` |
| 函数/变量 | `camelCase` | `parseList` |
| 常量 | `UPPER_SNAKE_CASE`(真正常量,非配置) | `MAX_TIMEOUT_MS` |
| React 组件 | `PascalCase` | `AppList` |
| 枚举值 | `PascalCase`(string enum) | `AppState.Installed` |
| 错误码 | `UPPER_SNAKE_CASE` | `E_SCOOP_INSTALL_TIMEOUT` |

---

## 3. 代码风格

### 3.1 Prettier(自动)

- `singleQuote: true`
- `semi: true`
- `trailingComma: 'all'`
- `printWidth: 100`
- `tabWidth: 2`

### 3.2 ESLint

- `@typescript-eslint/recommended`
- `eslint-plugin-react-hooks`
- 禁止 `console.log`(主进程用 `logger.info`,渲染端通过统一通道)
- 禁止未使用的导出

### 3.3 Import 顺序

1. Node/标准库
2. 第三方
3. `@/` 别名(本项目)
4. 相对路径(同目录可省略)
5. 类型(用 `import type`)

---

## 4. 错误码规范

### 4.1 IPC 错误形态

```ts
type IPCResult<T> = { ok: true; data: T } | { ok: false; error: IPCError };

interface IPCError {
  code: string;        // E_<DOMAIN>_<ACTION>_<REASON>
  message: string;     // 业务可读(可经 i18n 翻译)
  cause?: unknown;     // 原始错误,仅日志
}
```

### 4.2 错误码命名

`E_<DOMAIN>_<ACTION>_<REASON>`,全大写,下划线分隔。例:
- `E_SCOOP_NOT_FOUND`
- `E_SCOOP_INSTALL_TIMEOUT`
- `E_SCOOP_INSTALL_FAILED`
- `E_SCOOP_PARSE_FAILED`
- `E_PREFERENCES_INVALID`
- `E_IPC_INVALID_INPUT`
- `E_BUCKET_ADD_FAILED`
- `E_BUCKET_REMOVE_FAILED`
- `E_ONBOARDING_INSTALL_FAILED`

### 4.3 抛出约定

- 主进程:**禁止 throw 裸字符串**,统一捕获并包装为 `IPCError`
- 渲染端:`useApps().error` 即 IPCError,展示 `error.message` 即可
- neverthrow 不引入,自定义 Result 类型够用

---

## 5. 枚举/字典管理

### 5.1 共享枚举

位置:**仅** `src/shared/enums.ts`。
维护者:**只有 architect 能改**。
当前枚举(待 task 2 细化):

- `AppState`(对应 flow 中 App 状态机)
- `ScoopState`(对应 Scoop 自身状态机)
- `BucketState`(对应 Bucket 状态机)
- `InstallJobState`(对应 InstallJob 状态机)
- `UILanguage`: `'zh-CN' | 'en-US'`
- `BootStage`(对应 Boot Sequence)
- `ErrorCode`(所有 E_xxx)

### 5.2 业务常量

分散在各模块,**必须有显式类型**。例:

```ts
export const SCOOP_INSTALL_TIMEOUT_MS: number = 10 * 60 * 1000;
export const MAX_PARALLEL_JOBS: number = 1;
```

---

## 6. IPC 通道命名

格式:`scoop:<domain>:<action>[:vN]`,例:
- `scoop:apps:install`
- `scoop:apps:install:progress`(进度事件)

`vN` 预留版本,本项目 MVP 用 v1(省略)。变更需走破坏性协议升级。

---

## 7. 日志规范

### 7.1 主进程

- 结构化日志:`{ level, msg, ts, jobId?, ...meta }`
- 字段:`level: 'debug' | 'info' | 'warn' | 'error'`
- 写入:`%APPDATA%/scoop-gui/logs/main-<date>.log`(electron-log 或自实现)
- **敏感字段脱敏**:password、proxyCredential 不进日志

### 7.2 渲染端

- console 仅 debug 用
- 用户可见错误经 IPC error message 通道
- 不打印大量原始 stdout

---

## 8. 依赖管理

### 8.1 package.json

- **禁止** `"latest"` 或 `*`,所有依赖锁版本范围(如 `^1.2.3`)
- `pnpm-lock.yaml` 必须入库
- `dependencies` vs `devDependencies` 严格区分:
  - 主进程/渲染端运行时用的放 `dependencies`
  - 构建工具、测试、lint 放 `devDependencies`

### 8.2 安全更新

- 每周跑一次 `pnpm outdated`
- 重要依赖(electron、vite、react)走 PR 评审升级

---

## 9. 提交规范

### 9.1 Conventional Commits

- `<type>(<scope>): <subject>`
- type: feat / fix / refactor / docs / test / chore / build / ci
- scope: 模块名(如 `apps`、`buckets`、`onboarding`、`infra`)
- 例:`feat(apps): add single app install progress dialog`

### 9.2 Task trailer

opcflow hook 自动注入 `Task: #<id>` trailer(基于 `WORKBENCH_TASK_ID` 环境变量)。
多 agent 同分支时,此 trailer 是归因依据。

### 9.3 分支命名

- `feat/<scope>-<short-desc>`
- `fix/<scope>-<short-desc>`
- 例:`feat/apps-install-dialog`

---

## 10. 跨层禁止

| 禁止 | 理由 |
|---|---|
| renderer 直接 `import 'electron'` | 破坏 contextIsolation |
| 主进程直接渲染 DOM | 进程边界 |
| preload 包含业务逻辑(> 50 行非类型) | 体积膨胀 + 安全风险 |
| `src/shared/` 外使用未在 enums.ts 注册的状态字符串 | 漂移风险 |
| 跨端共享可变状态(单例/全局变量) | 进程隔离 |

---

## 11. 平台约束

- 仅 Windows(`process.platform === 'win32'` 启动时校验;非 Windows 直接退出并提示)
- 不引入跨平台兼容代码(electron-builder 不打 mac/linux 包)

---

## 12. 安全约束

- `contextIsolation: true`(强制)
- `nodeIntegration: false`(强制)
- `sandbox: true`(强制;preload 受限)
- preload 不 `require('fs')` 等高危模块
- 远程 URL 白名单:`about:blank` + 本地 `file://`(由 webPreferences 控制)
- 不引入 `electron@<23` 版本(安全更新周期)