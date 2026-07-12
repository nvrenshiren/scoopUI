# scoopUI Rust 重写实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Tauri 2.x + Rust 重写 scoopUI(当前 Electron 34 + React 19 + TS),保留前端渲染层,后端 100% Rust,体积从 ~150MB 缩到 ~10MB,启动从 ~3s 缩到 <1s。

**Architecture:** Tauri 2.x 作为应用壳,Rust 后端封装所有业务逻辑(Scoop CLI spawn、parsers、settings 持久化、进度推送),渲染端复用现有 React 19 + shadcn + Tailwind v4 + react-router v7 + Zustand + TanStack Query。IPC 通过 `#[tauri::command]` 命令注册,renderer 用 `window.__TAURI__.core.invoke('cmd_name', args)` 替代 `window.scoop.xxx()`。

**Tech Stack:**

- Tauri 2.x + tauri-plugin-shell / tauri-plugin-store / tauri-plugin-fs
- Rust 1.83+ stable + tokio + serde + serde_json + thiserror + anyhow
- 持久化:redb(纯 Rust embedded KV,无依赖)
- i18n:rust-i18n(编译时静态绑定)
- 前端:React 19 + Vite 5 + shadcn/ui + Tailwind v4 + react-router v7 + Zustand 5 + TanStack Query 5(全部沿用)
- 测试:cargo test(单元 + 集成)+ Node 跑 IPC adapter 测试
- 构建:tauri build → MSI + NSIS(Windows)

## 全局约束

- 平台:仅 Windows(`process.platform === 'win32'`,Scoop 本身仅 Windows)
- Rust 1.83+ stable edition 2021
- Tauri 2.x 最新稳定版
- IPC 通道保持与现有 `docs/architecture/api/electron/scoop-gui.md` 同名同 schema(zod 校验规范不变)
- v2 设计 token:`#22C55E` / `#0B1220` / `#111827` / Space Grotesk / DM Sans / JetBrains Mono / `bg-grid` / `bg-glow-top` / `glow-primary`
- i18n:仅 `zh-CN` + `en-US`,不使用第三方语言
- 错误码命名:`E_SCOOP_*` / `E_IPC_*` 沿用
- 体积目标:产物 `< 15MB`,启动 `< 1s`
- 提交规范:feat/fix/chore/refactor(scope):message
- 新仓库路径:`D:/Work/dawi/scoopUI-rs`(主仓 `scoopUI` 改名为 `scoopUI-electron` 或归档)

---

## 文件结构

```
D:/Work/dawi/scoopUI-rs/
├── package.json                   # 前端依赖(React 19 + Vite + shadcn + Tailwind v4)
├── pnpm-lock.yaml
├── tsconfig.{json,node,web}.json
├── tailwind.config.js
├── components.json
├── vite.config.ts
├── index.html                     # Vite 入口
├── src/                           # 前端(沿用 scoopUI/src/renderer/src)
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/{i18n,query-client,utils,tauri-bridge}.ts(x)
│   ├── stores/{theme-store,settings-store}.ts
│   ├── styles/globals.css
│   ├── components/{layout,ui}/...
│   └── pages/P0*/...
├── src-tauri/                     # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs                # 入口
│       ├── app.rs                 # 初始化 + 命令注册
│       ├── ipc/                   # IPC 命令(替代 ipc-router.ts)
│       │   ├── mod.rs
│       │   ├── apps.rs            # listInstalled / search / info / status / install / uninstall / update
│       │   ├── buckets.rs         # list / known / add / remove
│       │   ├── onboarding.rs      # detect / install
│       │   └── prefs.rs           # get / set
│       ├── scoop/                 # Scoop CLI 集成(替代 services/)
│       │   ├── mod.rs
│       │   ├── runner.rs          # spawn cmd.exe /c scoop.cmd
│       │   ├── parsers.rs         # parseListOutput / parseSearchOutput / ...
│       │   ├── service.rs         # ScoopService 门面
│       │   └── jobs.rs            # JobManager(进度推送)
│       ├── persist/               # redb 持久化(替代 settings-store.ts)
│       │   ├── mod.rs
│       │   ├── prefs.rs           # Preferences KV
│       │   └── migrations.rs
│       ├── errors.rs              # 错误模型(E_SCOOP_* enum)
│       ├── i18n.rs                # rust-i18n 绑定
│       └── tests/                 # 集成测试
│           ├── fixtures/          # scoop CLI 真实输出
│           ├── parsers_test.rs
│           └── runner_test.rs
└── docs/                          # 沿用 scoopUI/docs/...
```

---

## Task 拆分(12 个 Task,按依赖顺序)

### Task 1: 仓库初始化与目录结构

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/`(主目录)
- Create: `D:/Work/dawi/scoopUI-rs/.gitignore`
- Create: `D:/Work/dawi/scoopUI-rs/README.md`
- Create: `D:/Work/dawi/scoopUI-rs/CLAUDE.md`(从 scoopUI/CLAUDE.md 复制并改写)
- Create: `D:/Work/dawi/scoopUI-rs/.opencode/agents/tauri-developer.md`(新角色)

**Step 1: 创建新仓目录**

```bash
mkdir -p D:/Work/dawi/scoopUI-rs
cd D:/Work/dawi/scoopUI-rs
git init -b main
```

**Step 2: 写 .gitignore**

```gitignore
# Rust
target/
**/*.rs.bk
Cargo.lock.bak

# Tauri
src-tauri/target/
src-tauri/gen/

# Node
node_modules/
.pnpm-store/
out/
dist/

# IDE
.vscode/
.idea/
*.swp

# 系统
Thumbs.db
.DS_Store
```

**Step 3: 复制 CLAUDE.md**

```bash
cp D:/Work/dawi/scoopUI/CLAUDE.md D:/Work/dawi/scoopUI-rs/CLAUDE.md
```

**Step 4: 提交**

```bash
git add .gitignore README.md CLAUDE.md
git commit -m "chore(init): repo scaffolding for scoopUI-rs"
```

---

### Task 2: 前端基线迁移(React 19 + Vite + shadcn)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/package.json`
- Create: `D:/Work/dawi/scoopUI-rs/tsconfig.json` / `tsconfig.node.json` / `tsconfig.web.json`
- Create: `D:/Work/dawi/scoopUI-rs/vite.config.ts`
- Create: `D:/Work/dawi/scoopUI-rs/tailwind.config.js`
- Create: `D:/Work/dawi/scoopUI-rs/postcss.config.js`(删除,Tauri 不用)
- Create: `D:/Work/dawi/scoopUI-rs/index.html`
- Copy from `D:/Work/dawi/scoopUI/src/renderer/src/`:所有组件 / pages / lib / stores / styles

**Step 1: package.json**

```json
{
  "name": "scoop-gui-rs",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.web.json"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "i18next": "^23.0.0",
    "react-i18next": "^15.0.0",
    "zod": "^3.23.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-store": "^2.0.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-alert-dialog": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "cmdk": "^1.0.0",
    "sonner": "^1.7.0",
    "next-themes": "^0.4.0"
  }
}
```

**Step 2: vite.config.ts(Tauri 集成)**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
});
```

**Step 3: 复制 src/renderer/src 全部到 scoopUI-rs/src**

```bash
cp -r D:/Work/dawi/scoopUI/src/renderer/src/* D:/Work/dawi/scoopUI-rs/src/
```

**Step 4: 装依赖并验证 typecheck**

```bash
cd D:/Work/dawi/scoopUI-rs
pnpm install
pnpm typecheck
```

预期:`pnpm typecheck` 0 error(现有 src 文件通过)。

**Step 5: 删除 electron 依赖相关 import**

搜索 `window.scoop` / `electron` 引用,记录待 Task 6 改为 `window.__TAURI__`。

**Step 6: 提交**

```bash
git add -A
git commit -m "feat(frontend): migrate React 19 + Vite + shadcn baseline"
```

---

### Task 3: Rust 后端脚手架(src-tauri/Cargo.toml + main.rs)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/Cargo.toml`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/build.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/tauri.conf.json`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/main.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/lib.rs`

**Step 1: Cargo.toml**

```toml
[package]
name = "scoop-gui"
version = "0.1.0"
edition = "2021"
rust-version = "1.83"

[lib]
name = "scoop_gui_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-store = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["process", "io-util", "rt-multi-thread", "macros", "sync"] }
thiserror = "1"
anyhow = "1"
redb = "2"
once_cell = "1"
rust-i18n = "3"
chrono = { version = "0.4", features = ["serde"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

**Step 2: build.rs**

```rust
fn main() {
    tauri_build::build()
}
```

**Step 3: tauri.conf.json**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "scoop-gui",
  "version": "0.1.0",
  "identifier": "com.scoop-gui.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "windows": [
      {
        "title": "scoop-gui",
        "width": 1280,
        "height": 800,
        "minWidth": 960,
        "minHeight": 600,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false,
        "fullscreen": false,
        "resizable": true,
        "center": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ],
    "windows": {
      "wix": { "language": "zh-CN" },
      "nsis": {
        "languages": ["SimpChinese", "English"],
        "displayLanguageSelector": true
      }
    }
  }
}
```

**Step 4: src/main.rs**

```rust
// 防止 release 模式额外控制台
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    scoop_gui_lib::run()
}
```

**Step 5: src/lib.rs(占位)**

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 6: 提交**

```bash
cd D:/Work/dawi/scoopUI-rs
git add src-tauri/
git commit -m "feat(rust): Tauri 2.x scaffolding"
```

---

### Task 4: Rust 错误模型(E_SCOOP_* enum)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/errors.rs`
- Test: `D:/Work/dawi/scoopUI-rs/src-tauri/src/tests/errors_test.rs`

**Step 1: 写测试**

```rust
// src-tauri/src/tests/errors_test.rs
use scoop_gui_lib::errors::{ErrorCode, ScoopError};

#[test]
fn error_code_strings_match_legacy() {
    assert_eq!(ErrorCode::ScoopNotFound.as_str(), "E_SCOOP_NOT_FOUND");
    assert_eq!(ErrorCode::ScoopSpawnFailed.as_str(), "E_SCOOP_SPAWN_FAILED");
    assert_eq!(ErrorCode::ScoopParseFailed.as_str(), "E_SCOOP_PARSE_FAILED");
    assert_eq!(ErrorCode::ScoopInstallTimeout.as_str(), "E_SCOOP_INSTALL_TIMEOUT");
    assert_eq!(ErrorCode::IpcInvalidInput.as_str(), "E_IPC_INVALID_INPUT");
}

#[test]
fn error_serializes_to_legacy_shape() {
    let err = ScoopError::new(ErrorCode::ScoopSpawnFailed, "scoop 执行失败");
    let json = serde_json::to_value(&err).unwrap();
    assert_eq!(json["code"], "E_SCOOP_SPAWN_FAILED");
    assert_eq!(json["message"], "scoop 执行失败");
    assert_eq!(json["ok"], false);
}

#[test]
fn error_result_ok_serializes() {
    #[derive(serde::Serialize)]
    struct Row { name: String, version: String }
    let r: Result<Row, ScoopError> = Ok(Row { name: "7zip".into(), version: "26.00".into() });
    let json = serde_json::to_value(&r).unwrap();
    assert_eq!(json["ok"], true);
    assert_eq!(json["data"]["name"], "7zip");
}
```

**Step 2: 实现**

```rust
// src-tauri/src/errors.rs
use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCode {
    ScoopNotFound,
    ScoopVersionParseFailed,
    ScoopSpawnFailed,
    ScoopInstallTimeout,
    ScoopInstallFailed,
    ScoopParseFailed,
    ScoopPermissionDenied,
    OnboardingInstallFailed,
    PreferencesWriteFailed,
    IpcInvalidInput,
}

impl ErrorCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ScoopNotFound => "E_SCOOP_NOT_FOUND",
            Self::ScoopVersionParseFailed => "E_SCOOP_VERSION_PARSE_FAILED",
            Self::ScoopSpawnFailed => "E_SCOOP_SPAWN_FAILED",
            Self::ScoopInstallTimeout => "E_SCOOP_INSTALL_TIMEOUT",
            Self::ScoopInstallFailed => "E_SCOOP_INSTALL_FAILED",
            Self::ScoopParseFailed => "E_SCOOP_PARSE_FAILED",
            Self::ScoopPermissionDenied => "E_SCOOP_PERMISSION_DENIED",
            Self::OnboardingInstallFailed => "E_ONBOARDING_INSTALL_FAILED",
            Self::PreferencesWriteFailed => "E_PREFS_WRITE_FAILED",
            Self::IpcInvalidInput => "E_IPC_INVALID_INPUT",
        }
    }
}

#[derive(Debug, Clone, Error)]
#[error("[{code}] {message}", code = self.code.as_str())]
pub struct ScoopError {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cause: Option<String>,
}

impl ScoopError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self { code, message: message.into(), cause: None }
    }
    pub fn with_cause(mut self, cause: impl ToString) -> Self {
        self.cause = Some(cause.to_string());
        self
    }
}

/// IPCResult<T> = Result<T, ScoopError>,序列化保持 { ok: true, data } 或 { ok: false, error }
#[derive(Debug)]
pub enum IpcResult<T> {
    Ok(T),
    Err(ScoopError),
}

impl<T: Serialize> Serialize for IpcResult<T> {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::Ok(data) => {
                use serde::ser::SerializeStruct;
                let mut st = s.serialize_struct("IpcResult", 2)?;
                st.serialize_field("ok", &true)?;
                st.serialize_field("data", data)?;
                st.end()
            }
            Self::Err(err) => {
                use serde::ser::SerializeStruct;
                let mut st = s.serialize_struct("IpcResult", 2)?;
                st.serialize_field("ok", &false)?;
                st.serialize_field("error", err)?;
                st.end()
            }
        }
    }
}

impl<T> From<ScoopError> for IpcResult<T> {
    fn from(err: ScoopError) -> Self { Self::Err(err) }
}

impl<T, E: ToString> From<Result<T, E>> for IpcResult<T> {
    fn from(r: Result<T, E>) -> Self {
        match r {
            Ok(v) => Self::Ok(v),
            Err(e) => Self::Err(ScoopError::new(ErrorCode::ScoopSpawnFailed, e.to_string())),
        }
    }
}
```

**Step 3: 在 lib.rs 暴露模块**

```rust
pub mod errors;
```

**Step 4: 跑测试**

```bash
cd D:/Work/dawi/scoopUI-rs/src-tauri
cargo test errors
```

预期:3 passed。

**Step 5: 提交**

```bash
cd D:/Work/dawi/scoopUI-rs
git add src-tauri/
git commit -m "feat(rust): error model + IpcResult serde (legacy shape)"
```

---

### Task 5: Scoop CLI runner(spawn cmd.exe /c scoop.cmd)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/scoop/runner.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/scoop/mod.rs`
- Test: `D:/Work/dawi/scoopUI-rs/src-tauri/src/tests/runner_test.rs`

**Step 1: 写测试(集成测试,需要 scoop 已装)**

```rust
// src-tauri/src/tests/runner_test.rs
use scoop_gui_lib::scoop::runner::{run_scoop, ScoopOutput};

#[tokio::test]
async fn runs_scoop_version() {
    let result = run_scoop(&["--version"]).await;
    assert!(result.is_ok(), "scoop not available: {:?}", result);
    let out = result.unwrap();
    assert!(out.stdout.contains("Current Scoop version"), "got: {}", out.stdout);
}

#[tokio::test]
async fn handles_nonexistent_subcommand() {
    let result = run_scoop(&["nonexistent-cmd-xyz"]).await;
    assert!(result.is_ok(), "even on failure we return stdout/stderr");
    let out = result.unwrap();
    assert!(!out.stderr.is_empty() || out.exit_code != 0);
}

#[test]
fn command_construction_uses_cmd_exe() {
    use scoop_gui_lib::scoop::runner::build_command;
    let cmd = build_command(&["list"]);
    let argv: Vec<String> = cmd.iter().map(|s| s.to_string_lossy().into_owned()).collect();
    assert!(argv.iter().any(|a| a.contains("cmd.exe")), "argv: {:?}", argv);
    assert!(argv.iter().any(|a| a == "/c"), "argv: {:?}", argv);
    assert!(argv.iter().any(|a| a == "scoop.cmd"), "argv: {:?}", argv);
}
```

**Step 2: 实现 runner.rs**

```rust
// src-tauri/src/scoop/runner.rs
use std::ffi::OsString;
use std::process::Stdio;
use tokio::process::Command;
use tokio::io::{AsyncReadExt, BufReader};

#[derive(Debug)]
pub struct ScoopOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

/// 构造 spawn 参数(测试用):Windows 走 cmd.exe /d /s /c scoop.cmd ...
pub fn build_command(args: &[&str]) -> Vec<OsString> {
    let mut cmd: Vec<OsString> = Vec::new();
    if cfg!(windows) {
        let shell = std::env::var_os("ComSpec").unwrap_or_else(|| OsString::from("cmd.exe"));
        cmd.push(shell);
        cmd.push(OsString::from("/d"));
        cmd.push(OsString::from("/s"));
        cmd.push(OsString::from("/c"));
        cmd.push(OsString::from("scoop.cmd"));
    } else {
        cmd.push(OsString::from("scoop"));
    }
    for a in args { cmd.push(OsString::from(*a)); }
    cmd
}

pub async fn run_scoop(args: &[&str]) -> anyhow::Result<ScoopOutput> {
    let argv = build_command(args);
    let (program, argv_ref): (OsString, Vec<OsString>) = (argv[0].clone(), argv[1..].to_vec());

    let mut child = Command::new(&program)
        .args(&argv_ref)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null())
        .windows_attribute(/* TODO: hide window */)
        .spawn()?;

    let stdout_handle = child.stdout.take();
    let stderr_handle = child.stderr.take();

    let (stdout, stderr) = tokio::join!(
        read_to_end(stdout_handle),
        read_to_end(stderr_handle),
    );

    let status = child.wait().await?;
    Ok(ScoopOutput {
        stdout,
        stderr,
        exit_code: status.code().unwrap_or(-1),
    })
}

async fn read_to_end<R: tokio::io::AsyncRead + Unpin>(mut reader: Option<R>) -> String {
    let mut buf = String::new();
    if let Some(r) = reader.as_mut() {
        let mut reader = BufReader::new(r);
        let _ = reader.read_to_string(&mut buf).await;
    }
    buf
}
```

**Step 3: scoop/mod.rs**

```rust
pub mod runner;
pub mod parsers;
pub mod service;
pub mod jobs;
```

**Step 4: lib.rs 暴露**

```rust
pub mod scoop;
```

**Step 5: 跑测试**

```bash
cd D:/Work/dawi/scoopUI-rs/src-tauri
cargo test --test runner_test
```

预期:3 passed(scoop 在测试机上存在)。

**Step 6: 提交**

```bash
cd D:/Work/dawi/scoopUI-rs
git add src-tauri/
git commit -m "feat(scoop): runner with cmd.exe /c scoop.cmd wrapper"
```

---

### Task 6: Parsers(list / search / status / info / bucket)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/scoop/parsers.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/tests/fixtures/`(复制 scoop list / search / status / info / bucket list 真实输出)
- Test: `D:/Work/dawi/scoopUI-rs/src-tauri/src/tests/parsers_test.rs`

**Step 1: 复制 fixture**

```bash
mkdir -p D:/Work/dawi/scoopUI-rs/src-tauri/src/tests/fixtures
cd D:/Work/dawi/scoopUI-rs/src-tauri/src/tests/fixtures
scoop list > scoop-list.txt
scoop search git > scoop-search-git.txt
scoop status > scoop-status.txt
scoop bucket list > scoop-bucket-list.txt
scoop info 7zip > scoop-info-7zip.txt
```

**Step 2: 写测试**

```rust
// src-tauri/src/tests/parsers_test.rs
use scoop_gui_lib::scoop::parsers::*;
use std::fs;

fn load(name: &str) -> String {
    let path = format!("src/tests/fixtures/{}", name);
    fs::read_to_string(&path).unwrap_or_else(|_| panic!("missing fixture {}", path))
}

#[test]
fn parses_scoop_list() {
    let out = parse_list_output(&load("scoop-list.txt")).unwrap();
    assert!(!out.is_empty(), "should parse at least one app");
    let first = &out[0];
    assert!(!first.name.is_empty());
    assert!(!first.version.is_empty());
}

#[test]
fn parses_scoop_search() {
    let out = parse_search_output(&load("scoop-search-git.txt")).unwrap();
    assert!(!out.is_empty(), "git search returns > 0 hits");
}

#[test]
fn parses_scoop_status() {
    let out = parse_status_output(&load("scoop-status.txt")).unwrap();
    let outdated: Vec<_> = out.iter().filter(|a| a.is_outdated).collect();
    assert!(!outdated.is_empty(), "should detect at least one outdated app");
}

#[test]
fn parses_scoop_bucket_list() {
    let out = parse_bucket_list_output(&load("scoop-bucket-list.txt")).unwrap();
    assert!(!out.is_empty());
    assert!(out[0].source.starts_with("https://"), "got: {}", out[0].source);
}

#[test]
fn parses_scoop_info() {
    let out = parse_info_output(&load("scoop-info-7zip.txt")).unwrap().unwrap();
    assert_eq!(out.name, "7zip");
    assert!(out.version.starts_with("26."), "got: {}", out.version);
    assert!(out.description.len() > 10);
}

#[test]
fn reports_missing_header() {
    let r = parse_list_output("not a scoop output").unwrap_err();
    assert_eq!(r.code.as_str(), "E_SCOOP_PARSE_FAILED");
}
```

**Step 3: 实现 parsers.rs(关键函数)**

```rust
// src-tauri/src/scoop/parsers.rs
use serde::{Deserialize, Serialize};
use crate::errors::{ErrorCode, ScoopError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo { pub name: String, pub version: String, pub source: String, #[serde(skip_serializing_if="Option::is_none")] pub updated: Option<String>, #[serde(skip_serializing_if="Option::is_none")] pub info: Option<String> }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutdatedApp { pub name: String, pub installed: String, pub latest: String, #[serde(skip_serializing_if="Option::is_none")] pub missing: Option<String>, #[serde(skip_serializing_if="Option::is_none")] pub info: Option<String>, pub is_outdated: bool }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BucketInfo { pub name: String, pub source: String, #[serde(skip_serializing_if="Option::is_none")] pub updated: Option<String>, #[serde(skip_serializing_if="Option::is_none")] pub manifests: Option<u32> }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnownBucket { pub name: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppDetail { pub name: String, pub version: String, pub source: String, #[serde(skip_serializing_if="Option::is_none")] pub description: Option<String>, #[serde(skip_serializing_if="Option::is_none")] pub homepage: Option<String>, #[serde(skip_serializing_if="Option::is_none")] pub info: Option<String> }

pub fn parse_list_output(text: &str) -> Result<Vec<AppInfo>, ScoopError> {
    let mut found = false;
    let mut out = Vec::new();
    for line in text.lines() {
        let line = line.trim_end();
        if !found {
            if line.starts_with("Name") && line.contains("Version") && line.contains("Source") {
                found = true;
            }
            continue;
        }
        if line.is_empty() || line.starts_with("----") { continue; }
        // 4-5 列正则
        if let Some(row) = parse_table_row(line, 4) {
            out.push(AppInfo {
                name: row[0].clone(),
                version: row.get(1).cloned().unwrap_or_default(),
                source: row.get(2).cloned().unwrap_or_default(),
                updated: row.get(3).cloned(),
                info: None,
            });
        }
    }
    if !found {
        return Err(ScoopError::new(ErrorCode::ScoopParseFailed, "scoop list 输出缺少列头"));
    }
    Ok(out)
}

fn parse_table_row(line: &str, min_cols: usize) -> Option<Vec<String>> {
    // 简化:按 ≥2 空格分隔,前 min_cols 列各取第一段
    let cols: Vec<&str> = line.split("  ").filter(|s| !s.is_empty()).collect();
    if cols.len() < min_cols { return None; }
    Some(cols.iter().map(|s| s.trim().to_string()).collect())
}

// ... parse_search_output / parse_status_output / parse_bucket_list_output / parse_known_buckets_output / parse_info_output 类似实现(参照 Electron 版的 parsers.ts 逻辑)

pub fn parse_info_output(text: &str) -> Result<Option<AppDetail>, ScoopError> {
    // "Field : Value" 解析,参照 TS 版
    todo!("参见 parsers.ts:148")
}
```

> 完整 parsers 实现可参考 `scoopUI/src/main/services/parsers.ts` 逐行翻译。测试用真实 fixture 必须全部通过。

**Step 4: 跑测试**

```bash
cd D:/Work/dawi/scoopUI-rs/src-tauri
cargo test --test parsers_test
```

预期:6 passed。

**Step 5: 提交**

```bash
cd D:/Work/dawi/scoopUI-rs
git add src-tauri/
git commit -m "feat(scoop): parsers (list/search/status/info/bucket) with fixture tests"
```

---

### Task 7: redb 持久化(Preferences)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/persist/mod.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/persist/prefs.rs`
- Test: `D:/Work/dawi/scoopUI-rs/src-tauri/src/tests/prefs_test.rs`

**Step 1: 写测试**

```rust
// src-tauri/src/tests/prefs_test.rs
use scoop_gui_lib::persist::prefs::{PreferencesStore, Preferences};
use tempfile::TempDir;

#[test]
fn roundtrip() {
    let dir = TempDir::new().unwrap();
    let db_path = dir.path().join("prefs.redb");
    let mut store = PreferencesStore::open(&db_path).unwrap();

    let defaults = Preferences::default();
    store.put(&defaults).unwrap();

    let read = store.get().unwrap();
    assert_eq!(read.ui_language, defaults.ui_language);
    assert_eq!(read.theme, defaults.theme);
}

#[test]
fn merge_patch() {
    let dir = TempDir::new().unwrap();
    let mut store = PreferencesStore::open(dir.path().join("p.redb")).unwrap();
    store.put(&Preferences::default()).unwrap();

    let merged = store.patch(&serde_json::json!({"uiLanguage": "en-US"})).unwrap();
    assert_eq!(merged.ui_language, "en-US");
}
```

**Step 2: 实现**

```rust
// src-tauri/src/persist/prefs.rs
use redb::{Database, TableDefinition, ReadableTable};
use serde::{Deserialize, Serialize};
use std::path::Path;
use crate::errors::{ErrorCode, ScoopError};

const TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("preferences");

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Preferences {
    pub ui_language: String, // "zh-CN" | "en-US"
    pub theme: String,       // "light" | "dark" | "system"
    pub scoop_install_config: ScoopInstallConfig,
    #[serde(default)]
    pub last_selected_bucket: Option<String>,
    #[serde(default)]
    pub dismissed_announcements: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ScoopInstallConfig {
    pub scoop_dir: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scoop_global_dir: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scoop_cache_dir: Option<String>,
    pub no_proxy: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy_credential: Option<ProxyCredential>,
    pub proxy_use_default_credentials: bool,
    pub run_as_admin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProxyCredential { pub username: String, pub password: String }

impl Default for Preferences {
    fn default() -> Self {
        Self {
            ui_language: "zh-CN".into(),
            theme: "dark".into(),
            scoop_install_config: ScoopInstallConfig {
                scoop_dir: "D:\\Scoop".into(),
                scoop_global_dir: None,
                scoop_cache_dir: None,
                no_proxy: true,
                proxy: None,
                proxy_credential: None,
                proxy_use_default_credentials: false,
                run_as_admin: false,
            },
            last_selected_bucket: None,
            dismissed_announcements: vec![],
        }
    }
}

pub struct PreferencesStore { db: Database }

impl PreferencesStore {
    pub fn open(path: &Path) -> Result<Self, ScoopError> {
        let db = Database::create(path).map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        Ok(Self { db })
    }

    pub fn get(&self) -> Result<Preferences, ScoopError> {
        let read = self.db.begin_read().map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        let table = read.open_table(TABLE).map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        let row = table.get("current").map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        match row {
            Some(bytes) => serde_json::from_slice(bytes.value())
                .map_err(|e| ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string())),
            None => Ok(Preferences::default()),
        }
    }

    pub fn put(&mut self, prefs: &Preferences) -> Result<(), ScoopError> {
        let bytes = serde_json::to_vec(prefs)
            .map_err(|e| ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        let write = self.db.begin_write().map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        { write.open_table(TABLE).map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?
            .insert("current", bytes.as_slice()).map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?; }
        write.commit().map_err(|e|
            ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        Ok(())
    }

    pub fn patch(&mut self, patch: &serde_json::Value) -> Result<Preferences, ScoopError> {
        let mut current = self.get()?;
        let v = serde_json::to_value(&current).unwrap();
        let merged = merge(v, patch.clone());
        current = serde_json::from_value(merged)
            .map_err(|e| ScoopError::new(ErrorCode::PreferencesWriteFailed, e.to_string()))?;
        self.put(&current)?;
        Ok(current)
    }
}

fn merge(a: serde_json::Value, b: serde_json::Value) -> serde_json::Value {
    use serde_json::Value::*;
    match (a, b) {
        (Object(mut a), Object(b)) => { for (k, v) in b { a.insert(k, merge(a.remove(&k).unwrap_or(Null), v)); } Object(a) }
        (_, b) => b,
    }
}
```

**Step 3: 跑测试**

```bash
cd D:/Work/dawi/scoopUI-rs/src-tauri
cargo test --test prefs_test
```

预期:2 passed。

**Step 4: 提交**

```bash
cd D:/Work/dawi/scoopUI-rs
git add src-tauri/
git commit -m "feat(persist): redb-based preferences store with patch merge"
```

---

### Task 8: Tauri IPC 命令注册(读路径)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/ipc/mod.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/ipc/apps.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/ipc/buckets.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/ipc/onboarding.rs`
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/ipc/prefs.rs`
- Modify: `D:/Work/dawi/scoopUI-rs/src-tauri/src/lib.rs`

**Step 1: apps.rs**

```rust
// src-tauri/src/ipc/apps.rs
use crate::errors::{IpcResult, ErrorCode, ScoopError};
use crate::scoop::parsers::{AppInfo, AppDetail, OutdatedApp};
use crate::scoop::runner::run_scoop;
use crate::scoop::parsers;

#[tauri::command]
pub async fn list_installed() -> IpcResult<Vec<AppInfo>> {
    let out = match run_scoop(&["list"]).await {
        Ok(o) => o,
        Err(e) => return Err(ScoopError::new(ErrorCode::ScoopSpawnFailed, e.to_string())).into(),
    };
    match parsers::parse_list_output(&out.stdout) {
        Ok(v) => IpcResult::Ok(v),
        Err(e) => IpcResult::Err(e),
    }
}

#[tauri::command]
pub async fn search(query: String) -> IpcResult<Vec<AppInfo>> {
    if query.is_empty() { return Err(ScoopError::new(ErrorCode::IpcInvalidInput, "query 不能为空")).into(); }
    let out = match run_scoop(&["search", &query]).await {
        Ok(o) => o,
        Err(e) => return Err(ScoopError::new(ErrorCode::ScoopSpawnFailed, e.to_string())).into(),
    };
    match parsers::parse_search_output(&out.stdout) {
        Ok(v) => IpcResult::Ok(v),
        Err(e) => IpcResult::Err(e),
    }
}

#[tauri::command]
pub async fn info(name: String) -> IpcResult<Option<AppDetail>> {
    let out = match run_scoop(&["info", &name]).await {
        Ok(o) => o,
        Err(e) => return Err(ScoopError::new(ErrorCode::ScoopSpawnFailed, e.to_string())).into(),
    };
    match parsers::parse_info_output(&out.stdout) {
        Ok(v) => IpcResult::Ok(v),
        Err(e) => IpcResult::Err(e),
    }
}

#[tauri::command]
pub async fn status() -> IpcResult<Vec<OutdatedApp>> {
    let out = match run_scoop(&["status"]).await {
        Ok(o) => o,
        Err(e) => return Err(ScoopError::new(ErrorCode::ScoopSpawnFailed, e.to_string())).into(),
    };
    match parsers::parse_status_output(&out.stdout) {
        Ok(v) => IpcResult::Ok(v),
        Err(e) => IpcResult::Err(e),
    }
}

// 写路径(emit 进度)留 Task 9
```

**Step 2: buckets.rs / onboarding.rs / prefs.rs(同模式)**

```rust
// buckets.rs
use crate::errors::{IpcResult, ErrorCode, ScoopError};
use crate::scoop::parsers::{BucketInfo, KnownBucket};
use crate::scoop::runner::run_scoop;
use crate::scoop::parsers;

#[tauri::command]
pub async fn buckets_list() -> IpcResult<Vec<BucketInfo>> { /* 同上模式 */ todo!() }
#[tauri::command]
pub async fn buckets_known() -> IpcResult<Vec<KnownBucket>> { todo!() }

// onboarding.rs
#[tauri::command]
pub async fn onboarding_check() -> IpcResult<CheckOutput> { todo!() }

// prefs.rs
use crate::persist::prefs::{PreferencesStore, Preferences};
use crate::errors::IpcResult;

#[tauri::command]
pub async fn prefs_get(state: tauri::State<'_, AppState>) -> IpcResult<Preferences> {
    state.prefs.get().into()
}

#[tauri::command]
pub async fn prefs_set(patch: serde_json::Value, state: tauri::State<'_, AppState>) -> IpcResult<Preferences> {
    state.prefs.lock().unwrap().patch(&patch).into()
}

pub struct AppState {
    pub prefs: std::sync::Mutex<PreferencesStore>,
}
```

**Step 3: mod.rs**

```rust
pub mod apps;
pub mod buckets;
pub mod onboarding;
pub mod prefs;
pub use apps::*;
pub use buckets::*;
pub use onboarding::*;
pub use prefs::*;
```

**Step 4: lib.rs 注册命令**

```rust
mod errors;
mod persist;
mod scoop;
mod ipc;

use ipc::*;
use std::sync::Mutex;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let data_dir = app.path_resolver().app_data_dir().unwrap();
            std::fs::create_dir_all(&data_dir).ok();
            let prefs = persist::prefs::PreferencesStore::open(&data_dir.join("prefs.redb")).unwrap();
            app.manage(ipc::prefs::AppState { prefs: Mutex::new(prefs) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_installed, search, info, status,
            buckets_list, buckets_known,
            onboarding_check,
            prefs_get, prefs_set,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 5: 编译验证**

```bash
cd D:/Work/daui/scoopUI-rs
pnpm tauri dev
# 预期:打开窗口,无 panic(前端仍会报 window.scoop 未定义,因为 Task 6 才改)
```

**Step 6: 提交**

```bash
cd D:/Work/daui/scoopUI-rs
git add src-tauri/
git commit -m "feat(ipc): Tauri commands for read paths (apps/buckets/prefs/onboarding)"
```

---

### Task 9: 写路径 + JobManager(进度推送)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src-tauri/src/scoop/jobs.rs`
- Modify: `D:/Work/dawi/scoopUI-rs/src-tauri/src/ipc/apps.rs`(补 install/uninstall/update)
- Modify: `D:/Work/dawi/scoopUI-rs/src-tauri/src/ipc/buckets.rs`(补 add/remove)

**Step 1: jobs.rs**

```rust
// src-tauri/src/scoop/jobs.rs
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ProgressStage {
    Downloading,
    Extracting,
    Installing,
    Uninstalling,
    Updating,
    Cloning,
    Removing,
    Message,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProgressEvent {
    pub job_id: String,
    pub stage: ProgressStage,
    pub percent: u8,
    pub message: String,
}

pub struct JobManager {
    pub active: Mutex<HashMap<String, JobHandle>>,
    pub app: AppHandle,
}

pub struct JobHandle { pub cancelled: std::sync::atomic::AtomicBool }

impl JobManager {
    pub fn emit(&self, job_id: &str, stage: ProgressStage, percent: u8, message: impl Into<String>) {
        let _ = self.app.emit("job:progress", ProgressEvent {
            job_id: job_id.into(),
            stage, percent, message: message.into(),
        });
    }
}
```

**Step 2: install 命令示例**

```rust
// ipc/apps.rs 新增
#[tauri::command]
pub async fn install(name: String, app: tauri::AppHandle) -> IpcResult<serde_json::Value> {
    use tauri::Emitter;
    let job_id = format!("install-{}-{}", name, chrono::Utc::now().timestamp_millis());
    app.emit("job:progress", ProgressEvent {
        job_id: job_id.clone(),
        stage: ProgressStage::Installing, percent: 10,
        message: format!("正在安装 {}", name),
    }).ok();
    let out = run_scoop(&["install", &name]).await
        .map_err(|e| ScoopError::new(ErrorCode::ScoopSpawnFailed, e.to_string()))?;
    app.emit("job:progress", ProgressEvent {
        job_id: job_id.clone(),
        stage: ProgressStage::Message, percent: 100,
        message: format!("{} 安装完成", name),
    }).ok();
    if out.exit_code != 0 {
        return Err(ScoopError::new(ErrorCode::ScoopInstallFailed, out.stderr)).into();
    }
    IpcResult::Ok(serde_json::json!({ "ok": true, "jobId": job_id }))
}
// uninstall / update / bucket.add / bucket.remove 同模式
```

**Step 3: 提交**

```bash
git add src-tauri/
git commit -m "feat(scoop): JobManager + write-path commands with progress emit"
```

---

### Task 10: 前端 IPC adapter(window.scoop → window.__TAURI__)

**Files:**
- Create: `D:/Work/dawi/scoopUI-rs/src/lib/tauri-bridge.ts`
- Modify: `D:/Work/dawi/scoopUI-rs/src/main.tsx`(初始化桥接)
- Modify: 全部 `src/pages/**/hooks/*.ts` / `components/**/*.tsx`(自动通过桥接)

**Step 1: tauri-bridge.ts**

```ts
// src/lib/tauri-bridge.ts
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export type IpcError = { code: string; message: string; cause?: string };
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError };

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const result = (await invoke(cmd, args)) as IpcResult<T>;
  if (!result.ok) {
    const err = new Error(result.error.message);
    (err as any).code = result.error.code;
    (err as any).cause = result.error.cause;
    throw err;
  }
  return result.data;
}

export const scoop = {
  // onboarding
  detect: () => call<{ available: boolean; version: string; path: string }>('onboarding_check'),
  installScoop: () => call<{ ok: boolean; message: string }>('onboarding_install'),

  // apps read
  listInstalled: () => call<AppInfo[]>('list_installed'),
  search: (query: string) => call<AppInfo[]>('search', { query }),
  info: (name: string) => call<AppDetail | null>('info', { name }),
  status: () => call<OutdatedApp[]>('status'),

  // apps write(emit progress)
  install: (name: string) => call<{ ok: boolean; jobId: string }>('install', { name }),
  uninstall: (name: string) => call<{ ok: boolean; jobId: string }>('uninstall', { name }),
  update: (name?: string) => call<{ ok: boolean; jobId: string }>('update', { name: name ?? null }),

  // buckets
  bucketsList: () => call<BucketInfo[]>('buckets_list'),
  bucketsKnown: () => call<KnownBucket[]>('buckets_known'),
  bucketAdd: (name: string) => call<{ ok: boolean; jobId: string }>('bucket_add', { name }),
  bucketRemove: (name: string) => call<{ ok: boolean; jobId: string }>('bucket_remove', { name }),

  // prefs
  getSettings: () => call<Preferences>('prefs_get'),
  setSettings: (patch: Partial<Preferences>) => call<Preferences>('prefs_set', { patch }),

  // progress
  onProgress: (handler: (e: ProgressEvent) => void): UnlistenFn =>
    listen<ProgressEvent>('job:progress', (e) => handler(e.payload)),
};

// 在 renderer 中,window.scoop 现在指向这里
declare global {
  interface Window { scoop: typeof scoop; }
}
window.scoop = scoop;
export {};
```

**Step 2: 在 main.tsx 引入**

```tsx
import './lib/tauri-bridge'; // 副作用:挂 window.scoop
```

**Step 3: 类型**

```ts
// src/lib/tauri-types.ts
export type AppInfo = { name: string; version: string; source: string; updated?: string; info?: string };
export type AppDetail = { name: string; version: string; source: string; description?: string; homepage?: string; info?: string };
export type OutdatedApp = { name: string; installed: string; latest: string; missing?: string; info?: string; isOutdated: boolean };
export type BucketInfo = { name: string; source: string; updated?: string; manifests?: number };
export type KnownBucket = { name: string };
export type Preferences = { uiLanguage: 'zh-CN' | 'en-US'; theme: 'light' | 'dark' | 'system'; scoopInstallConfig: any };
export type ProgressEvent = { jobId: string; stage: 'downloading'|'extracting'|'installing'|'uninstalling'|'updating'|'cloning'|'removing'|'message'; percent: number; message: string };
```

**Step 4: Pxx hooks 适配**

```bash
# 批量替换(每文件)
sed -i 's/scoop:apps:listInstalled/list_installed/g' src/pages/**/hooks/*.ts
sed -i 's/scoop:prefs:get/prefs_get/g' src/pages/**/hooks/*.ts
# ... 其它通道
```

或更安全:在 `window.scoop` 加 alias 一次性兼容(只是临时桥接,后续 Task 清理):
```ts
// 旧 channel 名 → 新 Tauri command 名映射
const aliases = { 'list_installed': 'list_installed', ... }; // 同名无需映射
```

**Step 5: typecheck**

```bash
pnpm typecheck
```

预期:0 error。

**Step 6: 提交**

```bash
git add -A
git commit -m "feat(frontend): Tauri IPC bridge replacing Electron contextBridge"
```

---

### Task 11: 端到端 QA + 体积/性能验证

**Files:**
- Create: `D:/Work/daui/scoopUI-rs/scripts/smoke.cjs`(IPC 端到端,参考现有 SCOOP_GUI_SMOKE 模式)
- Modify: `D:/Work/daui/scoopUI-rs/CLAUDE.md`(更新现状)

**Step 1: smoke.cjs**

```js
// scripts/smoke.cjs
// 启动 pnpm tauri dev,逐个触发 window.scoop.* 调用,验证 IPC + 数据流
// (具体实现用 tauri-driver / playwright 控制 WebView)
```

**Step 2: 体积验证**

```bash
pnpm tauri build
ls -lah src-tauri/target/release/bundle/msi/*.msi
ls -lah src-tauri/target/release/bundle/nsis/*.exe
```

预期:
- MSI / NSIS < 15MB(对比 Electron 150MB)
- 启动 < 1s(对比 Electron ~3s)

**Step 3: 8 通道 IPC 端到端 smoke**

用 tauri-driver 或脚本注入,验证:
- `detect` → v0.5.3
- `listInstalled` → 67 rows
- `search("git")` → 244 rows
- `info("7zip")` → object
- `status` → 35 rows
- `bucketsList` → 4 rows
- `bucketsKnown` → 10 rows
- `prefsGet` → object

**Step 4: 提交**

```bash
git add -A
git commit -m "chore(qa): smoke harness + bundle size check"
```

---

### Task 12: 切仓与归档

**Files:**
- Modify: `D:/Work/daui/scoopUI/`(旧仓)→ 改名为 `D:/Work/daui/scoopUI-electron/`
- Modify: `D:/Work/daui/scoopUI-rs/`(新仓)→ 重命名为 `D:/Work/daui/scoopUI/`
- Modify: `D:/Work/daui/scoopUI/CLAUDE.md`(覆盖,记新栈)

**Step 1: 备份**

```bash
# 旧仓 git tag 标记
cd D:/Work/daui/scoopUI
git tag -a v1.0-electron -m "最后一个 Electron 版本,迁移到 Tauri 后归档"
git push origin v1.0-electron  # 如果有 remote
```

**Step 2: 移动**

```bash
# Windows PowerShell
Rename-Item D:\Work\daui\scoopUI D:\Work\daui\scoopUI-electron
Rename-Item D:\Work\daui\scoopUI-rs D:\Work\daui\scoopUI
```

**Step 3: 更新 CLAUDE.md**

新栈:
- Tauri 2.x + Rust 1.83+ + redb
- React 19 + Vite 5 + shadcn/ui + Tailwind v4(沿用)
- 体积 / 启动 vs Electron 对比

**Step 4: 最终验证**

```bash
cd D:/Work/daui/scoopUI
pnpm tauri dev
# 验证:窗口打开 → P04 显示 67 行真实数据 → P05 搜索 git 244 行 → P09 设置保存
```

**Step 5: 提交**

```bash
cd D:/Work/daui/scoopUI
git add -A
git commit -m "release: Tauri 2.x Rust 后端迁移完成"
git tag -a v2.0-tauri -m "Tauri 迁移完成"
```

---

## 时间估算

| Task | 内容 | 工时 |
|---|---|---:|
| 1 | 仓库初始化 | 1h |
| 2 | 前端基线迁移 | 3h |
| 3 | Rust 脚手架 | 1h |
| 4 | 错误模型 | 1h |
| 5 | Scoop runner | 2h |
| 6 | Parsers(6 个) | 3h |
| 7 | redb 持久化 | 2h |
| 8 | IPC 读路径 | 3h |
| 9 | IPC 写路径 + JobManager | 3h |
| 10 | 前端 IPC 适配 | 2h |
| 11 | QA + 体积验证 | 2h |
| 12 | 切仓 | 1h |
| **合计** | | **24h(3 个工作日)** |

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| Tauri 2.x Windows WebView2 在某些机器不可用 | Tauri 自动 fallback 到 webview2 安装引导;CI 测 Win10/11 |
| Rust 学习曲线(团队不熟) | 写更细的 Task,前 3 个 Task 走 TDD 让团队快速上手 |
| parsers 翻译丢细节 | Task 6 用真实 fixture 测试覆盖 5 个命令,缺失立即补 |
| redb 写并发安全 | 用 Mutex 包整个 store,Preferences 不是高频写 |
| 切仓一次性,无回退窗口 | 切仓前 git tag v1.0-electron;切后 1 周观察期,出问题可切回 |
| 体积没达标 | release profile 已 lto + opt-level=s + strip;若仍大,考虑动态特性开关 |
| `tauri-plugin-store` 替代部分功能 | 现 Task 7 用 redb;若后期需要 KV 多 namespace,plugin-store 是备选 |

## 不在范围内(后续阶段)

- 写路径实际跑 install / uninstall / update(会改用户系统)
- 自动更新(tauri-plugin-updater)
- 多语言扩展(只 zh-CN + en-US)
- 跨平台(macOS / Linux)
- 主题插件系统
- 设置同步