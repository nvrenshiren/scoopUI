//! 定位本机 scoop 并执行其命令。
//!
//! Windows 上 `scoop` 实际是 `<shims>\scoop.cmd`(内部再调 PowerShell)。
//! `std::process::Command` 不解析 PATHEXT,因此统一经 `cmd /d /c scoop ...` 调用,
//! 并把定位到的 shims 目录前置到子进程 PATH —— 这样刚装完 Scoop(父进程 PATH
//! 还是旧快照)也能立即调用,无需重启 GUI(F15/F16 复检依赖此行为)。

use serde::Serialize;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Command, Output, Stdio};

pub const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoopEnv {
    /// 定位到的 shims 目录(None 表示 scoop 已直接在 PATH 上)
    pub shims_dir: Option<String>,
    /// `scoop --version` 的原始输出(截断到前几行)
    pub version: String,
}

/// 构造一个调用 `scoop <args>` 的 Command(无窗口、必要时前置 shims 到 PATH)。
pub fn scoop_command(shims_dir: &Option<String>, args: &[&str]) -> Command {
    let mut cmd = Command::new("cmd");
    cmd.arg("/d").arg("/c").arg("scoop");
    for a in args {
        cmd.arg(a);
    }
    apply_env(&mut cmd, shims_dir);
    cmd
}

pub fn apply_env(cmd: &mut Command, shims_dir: &Option<String>) {
    if let Some(dir) = shims_dir {
        let path = std::env::var("PATH").unwrap_or_default();
        cmd.env("PATH", format!("{dir};{path}"));
    }
    // 避免 PowerShell 7 输出 ANSI 序列干扰解析
    cmd.env("NO_COLOR", "1");
    cmd.env("TERM", "dumb");
    cmd.creation_flags(CREATE_NO_WINDOW);
}

/// 同步执行 scoop 读命令,返回 (stdout+stderr 合并前的 Output)。
pub fn run_scoop(shims_dir: &Option<String>, args: &[&str]) -> Result<Output, String> {
    scoop_command(shims_dir, args)
        .stdin(Stdio::null())
        .output()
        .map_err(|e| format!("failed to launch scoop: {e}"))
}

pub fn stdout_text(output: &Output) -> String {
    String::from_utf8_lossy(&output.stdout).into_owned()
}

pub fn stderr_text(output: &Output) -> String {
    String::from_utf8_lossy(&output.stderr).into_owned()
}

/// 依次尝试候选 shims 目录与裸 PATH,探测 `scoop --version`(F15)。
///
/// `configured_scoop_dir` 来自持久化的安装配置(用户自定义 ScoopDir 时,
/// 新装的 scoop 不在默认位置)。
pub fn detect(configured_scoop_dir: Option<&str>) -> Option<ScoopEnv> {
    let mut candidates: Vec<Option<String>> = Vec::new();

    // 1) 裸 PATH(最常见:正常安装且 GUI 从资源管理器启动)
    candidates.push(None);

    // 2) 用户在本产品内配置过的 ScoopDir
    if let Some(dir) = configured_scoop_dir {
        if !dir.trim().is_empty() {
            candidates.push(Some(
                PathBuf::from(dir).join("shims").to_string_lossy().into_owned(),
            ));
        }
    }

    // 3) 环境变量 SCOOP
    if let Ok(scoop) = std::env::var("SCOOP") {
        if !scoop.trim().is_empty() {
            candidates.push(Some(
                PathBuf::from(scoop).join("shims").to_string_lossy().into_owned(),
            ));
        }
    }

    // 4) 默认位置 %USERPROFILE%\scoop\shims
    if let Ok(profile) = std::env::var("USERPROFILE") {
        candidates.push(Some(
            PathBuf::from(profile)
                .join("scoop")
                .join("shims")
                .to_string_lossy()
                .into_owned(),
        ));
    }

    for shims in candidates {
        // 有明确目录时先确认 scoop.cmd 存在,避免无谓的进程启动
        if let Some(dir) = &shims {
            if !PathBuf::from(dir).join("scoop.cmd").exists() {
                continue;
            }
        }
        if let Ok(output) = run_scoop(&shims, &["--version"]) {
            if output.status.success() {
                let text = stdout_text(&output);
                let version = summarize_version(&text);
                if !version.is_empty() {
                    return Some(ScoopEnv {
                        shims_dir: shims,
                        version,
                    });
                }
            }
        }
    }
    None
}

/// 从 `scoop --version` 输出中提取一行紧凑版本描述。
fn summarize_version(raw: &str) -> String {
    let lines: Vec<&str> = raw
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect();
    // 典型输出:
    //   Current Scoop version:
    //   v0.5.3 - Released at ...      (发布版)
    //   b588a06e chore(release): ...  (git 版)
    for (i, line) in lines.iter().enumerate() {
        if line.starts_with("Current Scoop version") {
            if let Some(next) = lines.get(i + 1) {
                return (*next).to_string();
            }
        }
    }
    lines.first().map(|s| s.to_string()).unwrap_or_default()
}
