//! 全部 Tauri IPC 命令。读命令(list/status/search/info/bucket)为阻塞子进程
//! 调用,统一经 spawn_blocking 执行;写操作一律走 InstallJob 队列(F17)。

use std::sync::{Arc, LazyLock};

use regex::Regex;
use serde::Serialize;
use tauri::State;

use crate::jobs::{JobDto, JobKind};
use crate::settings::{self, InstallConfig, Settings};
use crate::{config, installer, parse, scoop, Core};

/// 包名/桶名白名单(允许 bucket/name 形式);防止拼进 cmd 的参数携带元字符。
static NAME_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$").unwrap());
/// 桶仓库地址(https URL 或 git 形式)。
static REPO_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[A-Za-z0-9][A-Za-z0-9._:/@~+-]{0,255}$").unwrap());
/// 搜索关键字。
static QUERY_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$").unwrap());

/// `scoop config` 已知配置项白名单(= GUI 可视化的 32 项);拒绝把任意 key 拼进 scoop config。
static CONFIG_KEYS: &[&str] = &[
    // 下载器 aria2
    "aria2-enabled",
    "aria2-warning-enabled",
    "aria2-retry-wait",
    "aria2-split",
    "aria2-max-connection-per-server",
    "aria2-min-split-size",
    "aria2-options",
    // 网络与代理
    "proxy",
    "private_hosts",
    // 更新策略
    "scoop_repo",
    "scoop_branch",
    "force_update",
    "update_nightly",
    "hold_update_until",
    "autostash_on_conflict",
    "show_update_log",
    // 安装与工具
    "default_architecture",
    "use_external_7zip",
    "use_lessmsi",
    "use_sqlite_cache",
    "no_junction",
    "shim",
    "ignore_running_processes",
    "show_manifest",
    "use_isolated_path",
    "cat_style",
    "debug",
    // 路径
    "root_path",
    "global_path",
    "cache_path",
    // 令牌与安全
    "gh_token",
    "virustotal_api_key",
];

/// config 值字符白名单:覆盖路径(反斜杠/盘符冒号/空格)、代理(user:pass@host:port)、
/// 日期、架构、aria2 选项(空格/=/-)、令牌、仓库 URL;排除 cmd 元字符(& | < > ^ " 等)防注入。
static CONFIG_VALUE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[A-Za-z0-9 ._:/\\@~+=,#-]{1,512}$").unwrap());

fn shims_of(core: &Core) -> Option<String> {
    core.scoop
        .lock()
        .unwrap()
        .as_ref()
        .and_then(|e| e.shims_dir.clone())
}

/// 执行 scoop 读命令并返回 stdout;非零退出码转为错误(F19 命令级失败)。
fn run_read(core: &Core, args: &[&str]) -> Result<String, String> {
    let shims = shims_of(core);
    let out = scoop::run_scoop(&shims, args)?;
    if !out.status.success() {
        let stderr = scoop::stderr_text(&out);
        let stdout = scoop::stdout_text(&out);
        let detail = if stderr.trim().is_empty() { stdout } else { stderr };
        return Err(format!(
            "scoop {} failed (exit {:?}): {}",
            args.join(" "),
            out.status.code(),
            detail.trim()
        ));
    }
    Ok(scoop::stdout_text(&out))
}

// ---------------------------------------------------------------- settings

#[tauri::command]
pub fn get_settings(core: State<'_, Arc<Core>>) -> Settings {
    core.settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn set_language(core: State<'_, Arc<Core>>, language: String) -> Result<(), String> {
    if language != "zh" && language != "en" {
        return Err("unsupported language".into());
    }
    let mut s = core.settings.lock().unwrap();
    s.language = Some(language);
    settings::save(&s)
}

#[tauri::command]
pub fn set_theme(core: State<'_, Arc<Core>>, theme: String) -> Result<(), String> {
    if !matches!(theme.as_str(), "dark" | "light" | "system") {
        return Err("unsupported theme".into());
    }
    let mut s = core.settings.lock().unwrap();
    s.theme = Some(theme);
    settings::save(&s)
}

// ------------------------------------------------------------------ detect

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectResult {
    pub available: bool,
    pub version: Option<String>,
    pub shims_dir: Option<String>,
}

/// F15:探测本机 scoop 可用性,并缓存定位结果供后续命令使用。
///
/// 调试开关:设置环境变量 `SCOOP_GUI_FORCE_SETUP=1` 可强制报告"未检测到",
/// 用于在已装 scoop 的机器上预览 P01 协助安装页(仅影响本进程,无副作用)。
#[tauri::command]
pub async fn detect_scoop(core: State<'_, Arc<Core>>) -> Result<DetectResult, String> {
    if std::env::var("SCOOP_GUI_FORCE_SETUP").map(|v| v == "1").unwrap_or(false) {
        return Ok(DetectResult {
            available: false,
            version: None,
            shims_dir: None,
        });
    }
    let core = core.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let configured = core
            .settings
            .lock()
            .unwrap()
            .install_config
            .as_ref()
            .and_then(|c| c.scoop_dir.clone());
        let env = scoop::detect(configured.as_deref());
        let result = DetectResult {
            available: env.is_some(),
            version: env.as_ref().map(|e| e.version.clone()),
            shims_dir: env.as_ref().and_then(|e| e.shims_dir.clone()),
        };
        *core.scoop.lock().unwrap() = env;
        result
    })
    .await
    .map_err(|e| e.to_string())
}

// ------------------------------------------------------------- read queries

macro_rules! blocking_query {
    ($core:expr, $body:expr) => {{
        let core = $core.inner().clone();
        tauri::async_runtime::spawn_blocking(move || $body(core))
            .await
            .map_err(|e| e.to_string())?
    }};
}

/// query 为 scoop 的子串过滤(用于单包状态刷新,避免全量列表开销)。
#[tauri::command]
pub async fn scoop_list(
    core: State<'_, Arc<Core>>,
    query: Option<String>,
) -> Result<Vec<parse::InstalledApp>, String> {
    if let Some(q) = &query {
        if !NAME_RE.is_match(q) {
            return Err("invalid list query".into());
        }
    }
    blocking_query!(core, move |core: Arc<Core>| {
        let text = match &query {
            Some(q) => run_read(&core, &["list", q])?,
            None => run_read(&core, &["list"])?,
        };
        Ok(parse::parse_list(&text))
    })
}

#[tauri::command]
pub async fn scoop_status(core: State<'_, Arc<Core>>) -> Result<Vec<parse::StatusEntry>, String> {
    blocking_query!(core, |core: Arc<Core>| {
        let text = run_read(&core, &["status"])?;
        Ok(parse::parse_status(&text))
    })
}

/// 仅刷新 Scoop 自身与桶元数据(git fetch/pull),不动已装软件包。
/// 供"检查更新"在跑 status 前调用,保证过期清单基于最新 bucket 数据。
/// 注意:scoop update 更新 Scoop 本体后会退出非零提示重启 scoop,因此失败仅上抛、由前端降级。
#[tauri::command]
pub async fn scoop_update_repo(core: State<'_, Arc<Core>>) -> Result<(), String> {
    blocking_query!(core, |core: Arc<Core>| {
        let shims = shims_of(&core);
        let out = scoop::run_scoop(&shims, &["update"])?;
        if out.status.success() {
            Ok(())
        } else {
            Err(format!(
                "scoop update failed (exit {:?}): {}",
                out.status.code(),
                scoop::stderr_text(&out).trim()
            ))
        }
    })
}

#[tauri::command]
pub async fn scoop_search(
    core: State<'_, Arc<Core>>,
    query: Option<String>,
) -> Result<Vec<parse::SearchResult>, String> {
    if let Some(q) = &query {
        if !QUERY_RE.is_match(q) {
            return Err("invalid search query".into());
        }
    }
    blocking_query!(core, move |core: Arc<Core>| {
        let text = match &query {
            Some(q) => run_read(&core, &["search", q])?,
            None => run_read(&core, &["search"])?,
        };
        Ok(parse::parse_search(&text))
    })
}

#[tauri::command]
pub async fn scoop_info(
    core: State<'_, Arc<Core>>,
    name: String,
) -> Result<Vec<(String, String)>, String> {
    if !NAME_RE.is_match(&name) {
        return Err("invalid app name".into());
    }
    blocking_query!(core, move |core: Arc<Core>| {
        let text = run_read(&core, &["info", &name])?;
        Ok(parse::parse_info(&text))
    })
}

#[tauri::command]
pub async fn bucket_list(core: State<'_, Arc<Core>>) -> Result<Vec<parse::BucketInfo>, String> {
    blocking_query!(core, |core: Arc<Core>| {
        let text = run_read(&core, &["bucket", "list"])?;
        Ok(parse::parse_bucket_list(&text))
    })
}

#[tauri::command]
pub async fn bucket_known(core: State<'_, Arc<Core>>) -> Result<Vec<String>, String> {
    blocking_query!(core, |core: Arc<Core>| {
        let text = run_read(&core, &["bucket", "known"])?;
        Ok(parse::parse_known_buckets(&text))
    })
}

// -------------------------------------------------------------------- jobs

/// 写操作统一入队(F05/F06/F07/F11/F12)。kind 取值:
/// install / uninstall / update / bucket-add / bucket-remove
#[tauri::command]
pub fn enqueue_job(
    core: State<'_, Arc<Core>>,
    kind: String,
    target: String,
    repo: Option<String>,
) -> Result<u64, String> {
    let job_kind = match kind.as_str() {
        "install" => JobKind::Install,
        "uninstall" => JobKind::Uninstall,
        "update" => JobKind::Update,
        "bucket-add" => JobKind::BucketAdd,
        "bucket-remove" => JobKind::BucketRemove,
        _ => return Err(format!("unknown job kind: {kind}")),
    };
    if !NAME_RE.is_match(&target) {
        return Err("invalid target name".into());
    }
    let repo = match repo {
        Some(r) if !r.trim().is_empty() => {
            if !REPO_RE.is_match(&r) {
                return Err("invalid bucket repo url".into());
            }
            Some(r)
        }
        _ => None,
    };
    core.jobs.enqueue(job_kind, target, repo, None)
}

/// F16:确认安装配置 → 持久化 → 生成 runner → 入队执行。
#[tauri::command]
pub fn install_scoop(core: State<'_, Arc<Core>>, config: InstallConfig) -> Result<u64, String> {
    {
        let mut s = core.settings.lock().unwrap();
        s.install_config = Some(config.clone());
        // 持久化失败不阻塞安装本身(flow §1.8 同源原则),但记录到返回值之外
        let _ = settings::save(&s);
    }
    let runner = installer::prepare_runner(&config)?;
    core.jobs
        .enqueue(JobKind::InstallScoop, "Scoop".to_string(), None, Some(runner))
}

#[tauri::command]
pub fn cancel_job(core: State<'_, Arc<Core>>, id: u64) -> Result<(), String> {
    core.jobs.cancel(id)
}

#[tauri::command]
pub fn list_jobs(core: State<'_, Arc<Core>>) -> Vec<JobDto> {
    core.jobs.list()
}

#[tauri::command]
pub fn job_log(core: State<'_, Arc<Core>>, id: u64) -> Vec<String> {
    core.jobs.log_of(id)
}

// ----------------------------------------------------------- scoop config (F20)

/// 读取 scoop 自身全部配置(直接读 config.json,一次拿全;不解析 CLI 输出)。
#[tauri::command]
pub async fn scoop_config_get() -> Result<serde_json::Value, String> {
    tauri::async_runtime::spawn_blocking(config::read_config)
        .await
        .map_err(|e| e.to_string())
}

/// 写入单个配置项 → `scoop config <name> <value>`(即时生效,由 scoop 处理类型与副作用)。
#[tauri::command]
pub async fn scoop_config_set(
    core: State<'_, Arc<Core>>,
    name: String,
    value: String,
) -> Result<(), String> {
    if !CONFIG_KEYS.contains(&name.as_str()) {
        return Err(format!("unknown config key: {name}"));
    }
    if !CONFIG_VALUE_RE.is_match(&value) {
        return Err("invalid config value".into());
    }
    blocking_query!(core, move |core: Arc<Core>| {
        run_read(&core, &["config", &name, &value])?;
        Ok(())
    })
}

/// 删除单个配置项 → `scoop config rm <name>`(恢复该项默认)。
#[tauri::command]
pub async fn scoop_config_rm(core: State<'_, Arc<Core>>, name: String) -> Result<(), String> {
    if !CONFIG_KEYS.contains(&name.as_str()) {
        return Err(format!("unknown config key: {name}"));
    }
    blocking_query!(core, move |core: Arc<Core>| {
        run_read(&core, &["config", "rm", &name])?;
        Ok(())
    })
}
