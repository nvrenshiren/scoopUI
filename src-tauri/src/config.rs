//! 读取 scoop 自身的配置文件(`scoop config` 的持久化位置)。
//!
//! scoop 把配置存于 `$XDG_CONFIG_HOME\scoop\config.json`,缺省为
//! `%USERPROFILE%\.config\scoop\config.json`(见 scoop `core.ps1` 的 `$configFile`)。
//! 写操作一律走 `scoop config` CLI(见 commands.rs),让 scoop 负责类型转换与副作用;
//! 这里只负责一次性读取当前全部配置值,交前端按 schema 呈现(F20)。

use std::path::PathBuf;

use serde_json::{Map, Value};

/// 复现 scoop 的配置文件路径解析:优先 `XDG_CONFIG_HOME`,否则 `%USERPROFILE%\.config`。
pub fn config_path() -> Option<PathBuf> {
    let home = std::env::var("XDG_CONFIG_HOME")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .map(PathBuf::from)
        .or_else(|| {
            std::env::var("USERPROFILE")
                .ok()
                .filter(|s| !s.trim().is_empty())
                .map(|p| PathBuf::from(p).join(".config"))
        })?;
    Some(home.join("scoop").join("config.json"))
}

/// 读取当前 scoop 配置为 JSON 对象;文件缺失/解析失败时返回空对象(视作全部为默认值)。
pub fn read_config() -> Value {
    let path = match config_path() {
        Some(p) => p,
        None => return Value::Object(Map::new()),
    };
    match std::fs::read_to_string(&path) {
        Ok(text) => match serde_json::from_str::<Value>(&text) {
            Ok(v @ Value::Object(_)) => v,
            _ => Value::Object(Map::new()),
        },
        Err(_) => Value::Object(Map::new()),
    }
}
