//! 本机持久化:界面语言 / 主题 / 协助安装配置(PRD §4.5)。
//! 存放于 %APPDATA%\scoop-gui\config.json,原子写入。

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
    match fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text).unwrap_or_default(),
        Err(_) => Settings::default(),
    }
}

pub fn save(settings: &Settings) -> Result<(), String> {
    let dir = config_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("create config dir: {e}"))?;
    let tmp = dir.join("config.json.tmp");
    let text = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&tmp, text).map_err(|e| format!("write config: {e}"))?;
    let dest = config_file();
    // Windows 上 rename 到已存在目标会失败,先移除旧文件
    let _ = fs::remove_file(&dest);
    fs::rename(&tmp, &dest).map_err(|e| format!("persist config: {e}"))?;
    Ok(())
}

/// 供协助安装脚本使用的临时目录(%TEMP%\scoop-gui)
pub fn work_dir() -> PathBuf {
    std::env::temp_dir().join("scoop-gui")
}
