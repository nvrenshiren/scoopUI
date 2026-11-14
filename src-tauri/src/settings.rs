//! 本机持久化:界面语言 / 主题 / 协助安装配置(PRD §4.5)。
//! 存放于 %APPDATA%\scoop-gui\config.json;通过临时文件和备份文件保存。

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Scoop 官方 install.ps1 暴露的参数集(PRD 边界:不引入其它安装选项)。
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct InstallConfig {
    pub scoop_dir: Option<String>,
    pub scoop_global_dir: Option<String>,
    pub scoop_cache_dir: Option<String>,
    pub no_proxy: Option<String>,
    pub proxy: Option<String>,
    pub proxy_credential_user: Option<String>,
    pub proxy_credential_password: Option<String>,
    pub proxy_use_default_credentials: bool,
    pub run_as_admin: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    /// "zh" | "en";None 表示尚未选择(首启需要询问)
    pub language: Option<String>,
    /// "dark" | "light" | "system"
    pub theme: Option<String>,
    /// 最近一次确认的协助安装配置,供重装复用
    pub install_config: Option<InstallConfig>,
}

fn config_dir() -> PathBuf {
    let base = std::env::var("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));
    base.join("scoop-gui")
}

fn config_file() -> PathBuf {
    config_dir().join("config.json")
}

pub fn load() -> Settings {
    let path = config_file();
    let backup = path.with_extension("json.bak");
    read_settings(&path)
        .or_else(|| read_settings(&backup))
        .unwrap_or_default()
}

fn read_settings(path: &std::path::Path) -> Option<Settings> {
    let text = fs::read_to_string(path).ok()?;
    serde_json::from_str(&text).ok()
}

pub fn save(settings: &Settings) -> Result<(), String> {
    let dir = config_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("create config dir: {e}"))?;
    let tmp = dir.join("config.json.tmp");
    let text = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&tmp, text).map_err(|e| format!("write config: {e}"))?;
    let dest = config_file();
    let backup = dir.join("config.json.bak");
    let had_previous = dest.exists();
    let previous_is_valid = read_settings(&dest).is_some();
    let backup_is_valid = read_settings(&backup).is_some();
    let moved_previous = had_previous && !(backup_is_valid && !previous_is_valid);

    if had_previous && previous_is_valid {
        match fs::remove_file(&backup) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(format!("remove previous config backup: {error}")),
        }
        fs::rename(&dest, &backup).map_err(|e| format!("backup config: {e}"))?;
    } else if had_previous && backup_is_valid {
        // Keep the only valid copy available until the new file is installed.
        fs::remove_file(&dest).map_err(|e| format!("remove invalid config: {e}"))?;
    } else if had_previous {
        match fs::remove_file(&backup) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(format!("remove previous config backup: {error}")),
        }
        fs::rename(&dest, &backup).map_err(|e| format!("backup config: {e}"))?;
    }

    if let Err(error) = fs::rename(&tmp, &dest) {
        if moved_previous {
            if let Err(restore_error) = fs::rename(&backup, &dest) {
                return Err(format!(
                    "persist config: {error}; restore previous config: {restore_error}"
                ));
            }
        }
        return Err(format!("persist config: {error}"));
    }

    // The new file is already in place. A leftover backup is safe; load() prefers the primary.
    let _ = fs::remove_file(&backup);
    Ok(())
}

/// 供协助安装脚本使用的临时目录(%TEMP%\scoop-gui)
pub fn work_dir() -> PathBuf {
    std::env::temp_dir().join("scoop-gui")
}
