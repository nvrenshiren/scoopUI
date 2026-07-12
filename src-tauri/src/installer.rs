//! 协助安装 Scoop(F16):生成 PowerShell runner 脚本,由 InstallJob 队列执行。
//!
//! 参数集严格限于官方 install.ps1 暴露的集合(PRD 边界):
//! ScoopDir / ScoopGlobalDir / ScoopCacheDir / NoProxy / Proxy /
//! ProxyCredential / ProxyUseDefaultCredentials / RunAsAdmin。
//!
//! RunAsAdmin 勾选时走提权路径:外层脚本 Start-Process -Verb RunAs 弹 UAC,
//! 内层脚本把输出重定向到日志文件,外层等待结束后回放日志并按 marker 传递退出码
//! (提权进程的 stdout 无法直接接回本进程,只能落盘中转)。

use std::fs;
use std::path::PathBuf;

use crate::settings::{work_dir, InstallConfig};

/// PowerShell 单引号字符串转义:' → ''
fn ps_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', "''"))
}

fn opt(v: &Option<String>) -> Option<&str> {
    v.as_deref().map(str::trim).filter(|s| !s.is_empty())
}

/// 拼出传给 install.ps1 的参数串(不含 ProxyCredential,凭据单独构造)。
fn build_args(cfg: &InstallConfig) -> String {
    let mut parts: Vec<String> = Vec::new();
    if let Some(v) = opt(&cfg.scoop_dir) {
        parts.push(format!("-ScoopDir {}", ps_quote(v)));
    }
    if let Some(v) = opt(&cfg.scoop_global_dir) {
        parts.push(format!("-ScoopGlobalDir {}", ps_quote(v)));
    }
    if let Some(v) = opt(&cfg.scoop_cache_dir) {
        parts.push(format!("-ScoopCacheDir {}", ps_quote(v)));
    }
    if let Some(v) = opt(&cfg.no_proxy) {
        parts.push(format!("-NoProxy {}", ps_quote(v)));
    }
    if let Some(v) = opt(&cfg.proxy) {
        parts.push(format!("-Proxy {}", ps_quote(v)));
    }
    if opt(&cfg.proxy_credential_user).is_some() {
        parts.push("-ProxyCredential $scoopGuiCred".to_string());
    }
    if cfg.proxy_use_default_credentials {
        parts.push("-ProxyUseDefaultCredentials".to_string());
    }
    if cfg.run_as_admin {
        parts.push("-RunAsAdmin".to_string());
    }
    parts.join(" ")
}

/// 凭据构造语句(仅当填写了代理凭据用户名)。
fn cred_snippet(cfg: &InstallConfig) -> String {
    match (opt(&cfg.proxy_credential_user), opt(&cfg.proxy_credential_password)) {
        (Some(user), pass) => format!(
            "$scoopGuiSec = ConvertTo-SecureString {} -AsPlainText -Force\n$scoopGuiCred = New-Object System.Management.Automation.PSCredential({}, $scoopGuiSec)\n",
            ps_quote(pass.unwrap_or("")),
            ps_quote(user)
        ),
        _ => String::new(),
    }
}

/// 生成 runner 脚本,返回其路径(交给 InstallJob 执行)。
pub fn prepare_runner(cfg: &InstallConfig) -> Result<PathBuf, String> {
    let dir = work_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("create work dir: {e}"))?;

    let installer = dir.join("install-scoop.ps1");
    let runner = dir.join("runner.ps1");
    let args = build_args(cfg);
    let cred = cred_snippet(cfg);

    if cfg.run_as_admin {
        let log = dir.join("elevated-install.log");
        let marker = dir.join("elevated-exit.txt");
        let inner = dir.join("inner.ps1");

        let inner_script = format!(
            r#"$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$log = {log}
$marker = {marker}
try {{
    '[scoop-gui] [1/2] Downloading Scoop installer (https://get.scoop.sh)...' | Add-Content -Path $log
    Invoke-RestMethod -Uri 'https://get.scoop.sh' -OutFile {installer}
    '[scoop-gui] [2/2] Running Scoop installer (elevated)...' | Add-Content -Path $log
    {cred}& {installer} {args} *>> $log
    Set-Content -Path $marker -Value '0'
}} catch {{
    ($_ | Out-String) | Add-Content -Path $log
    Set-Content -Path $marker -Value '1'
}}
"#,
            log = ps_quote(&log.to_string_lossy()),
            marker = ps_quote(&marker.to_string_lossy()),
            installer = ps_quote(&installer.to_string_lossy()),
            cred = cred,
            args = args,
        );
        fs::write(&inner, encode_utf8_bom(&inner_script)).map_err(|e| e.to_string())?;

        let runner_script = format!(
            r#"$ErrorActionPreference = 'Stop'
$log = {log}
$marker = {marker}
Remove-Item $log, $marker -ErrorAction SilentlyContinue
Write-Output '[scoop-gui] Requesting administrator elevation (UAC prompt)...'
try {{
    Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',{inner})
}} catch {{
    Write-Output '[scoop-gui] Elevation was refused or failed.'
    Write-Output ($_ | Out-String)
    exit 1
}}
if (Test-Path $log) {{ Get-Content $log | Write-Output }}
if ((Test-Path $marker) -and ((Get-Content $marker) -eq '0')) {{
    Write-Output '[scoop-gui] Installer finished successfully.'
    exit 0
}} else {{
    Write-Output '[scoop-gui] Installer reported failure.'
    exit 1
}}
"#,
            log = ps_quote(&log.to_string_lossy()),
            marker = ps_quote(&marker.to_string_lossy()),
            inner = ps_quote(&inner.to_string_lossy()),
        );
        fs::write(&runner, encode_utf8_bom(&runner_script)).map_err(|e| e.to_string())?;
    } else {
        let runner_script = format!(
            r#"$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Write-Output '[scoop-gui] [1/2] Downloading Scoop installer (https://get.scoop.sh)...'
Invoke-RestMethod -Uri 'https://get.scoop.sh' -OutFile {installer}
Write-Output '[scoop-gui] [2/2] Running Scoop installer...'
{cred}& {installer} {args}
if (-not $?) {{ exit 1 }}
exit 0
"#,
            installer = ps_quote(&installer.to_string_lossy()),
            cred = cred,
            args = args,
        );
        fs::write(&runner, encode_utf8_bom(&runner_script)).map_err(|e| e.to_string())?;
    }

    Ok(runner)
}

/// Windows PowerShell 5.1 对无 BOM 文件按 ANSI 读取;加 BOM 保证路径中的
/// 非 ASCII 字符(如中文用户名)不被破坏。
fn encode_utf8_bom(text: &str) -> Vec<u8> {
    let mut bytes = vec![0xEF, 0xBB, 0xBF];
    bytes.extend_from_slice(text.as_bytes());
    bytes
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quotes_single_quotes() {
        assert_eq!(ps_quote("it's"), "'it''s'");
    }

    #[test]
    fn builds_args_from_config() {
        let cfg = InstallConfig {
            scoop_dir: Some("D:\\Scoop".into()),
            proxy: Some("http://127.0.0.1:7890".into()),
            run_as_admin: true,
            ..Default::default()
        };
        let args = build_args(&cfg);
        assert!(args.contains("-ScoopDir 'D:\\Scoop'"));
        assert!(args.contains("-Proxy 'http://127.0.0.1:7890'"));
        assert!(args.contains("-RunAsAdmin"));
        assert!(!args.contains("-NoProxy"));
    }
}
