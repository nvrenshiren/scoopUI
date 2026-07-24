mod commands;
mod config;
mod installer;
mod jobs;
mod parse;
mod scoop;
mod settings;

use std::sync::{Arc, Mutex};

use tauri::Manager;

/// 全局共享状态:持久化设置、scoop 定位结果、任务队列。
pub struct Core {
    pub settings: Mutex<settings::Settings>,
    pub scoop: Mutex<Option<scoop::ScoopEnv>>,
    pub jobs: jobs::JobManager,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let core = Arc::new(Core {
        settings: Mutex::new(settings::load()),
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
                .start(app.handle().clone(), core_for_setup.clone());
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
