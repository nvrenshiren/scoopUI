mod commands;
mod config;
mod installer;
mod jobs;
mod parse;
mod scoop;
mod settings;

use std::sync::{Arc, Mutex, MutexGuard};

use tauri::Manager;

/// 全局共享状态:持久化设置、scoop 定位结果、任务队列。
pub struct Core {
    pub settings: Mutex<settings::Settings>,
    /// 串行化设置快照写盘,避免持有 `settings` 数据锁执行文件 I/O。
    pub settings_persistence: Mutex<()>,
    pub scoop: Mutex<Option<scoop::ScoopEnv>>,
    pub jobs: jobs::JobManager,
}

impl Core {
    pub(crate) fn lock_settings(&self) -> MutexGuard<'_, settings::Settings> {
        self.settings
            .lock()
            .expect("Core.settings poisoned; refusing to use possibly partial settings")
    }

    pub(crate) fn lock_settings_persistence(&self) -> MutexGuard<'_, ()> {
        self.settings_persistence
            .lock()
            .expect("Core.settings_persistence poisoned; refusing unordered settings writes")
    }

    pub(crate) fn lock_scoop(&self) -> MutexGuard<'_, Option<scoop::ScoopEnv>> {
        self.scoop
            .lock()
            .expect("Core.scoop poisoned; refusing to use possibly partial detection state")
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let core = Arc::new(Core {
        settings: Mutex::new(settings::load()),
        settings_persistence: Mutex::new(()),
        scoop: Mutex::new(None),
        jobs: jobs::JobManager::new(),
    });
    let core_for_setup = core.clone();

    tauri::Builder::default()
        // F18 单实例:再次启动时唤起并聚焦已有窗口,而非并发拉起
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .manage(core)
        .setup(move |app| {
            core_for_setup
                .jobs
                .start(app.handle().clone(), core_for_setup.clone())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::set_language,
            commands::set_theme,
            commands::detect_scoop,
            commands::scoop_list,
            commands::scoop_status,
            commands::scoop_update_repo,
            commands::scoop_search,
            commands::scoop_info,
            commands::bucket_list,
            commands::bucket_known,
            commands::enqueue_job,
            commands::install_scoop,
            commands::cancel_job,
            commands::list_jobs,
            commands::job_log,
            commands::scoop_config_get,
            commands::scoop_config_set,
            commands::scoop_config_rm,
        ])
        // Tauri cannot recover from a failed event-loop startup; surface that fatal runtime error.
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
