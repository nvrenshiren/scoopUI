//! InstallJob 任务队列(flow §2.4):承载安装/卸载/更新/桶增删/协助安装 Scoop
//! 的统一长时任务对象。顺序执行(排队中 → 执行中 → 已成功/已失败/已取消),
//! 输出逐行以事件流推送给前端(F17)。

use serde::Serialize;
use std::collections::BTreeMap;
use std::io::{BufRead, BufReader};
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex, MutexGuard, OnceLock};

use tauri::{AppHandle, Emitter};

use crate::scoop::{self, CREATE_NO_WINDOW};
use crate::Core;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum JobKind {
    Install,
    Uninstall,
    Update,
    BucketAdd,
    BucketRemove,
    InstallScoop,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum JobState {
    Queued,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}

#[derive(Debug)]
pub struct Job {
    pub id: u64,
    pub kind: JobKind,
    pub target: String,
    pub repo: Option<String>,
    pub script: Option<PathBuf>,
    pub state: JobState,
    pub log: Vec<String>,
    pub exit_code: Option<i32>,
    pub cancel_requested: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobDto {
    pub id: u64,
    pub kind: JobKind,
    pub target: String,
    pub state: JobState,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobLogEvent {
    pub id: u64,
    pub line: String,
}

impl Job {
    fn dto(&self) -> JobDto {
        JobDto {
            id: self.id,
            kind: self.kind,
            target: self.target.clone(),
            state: self.state,
            exit_code: self.exit_code,
        }
    }
}

#[derive(Default)]
struct JobsState {
    next_id: u64,
    jobs: BTreeMap<u64, Job>,
    current_pid: Option<u32>,
    tx: Option<Sender<u64>>,
}

pub struct JobManager {
    state: Mutex<JobsState>,
    app: OnceLock<AppHandle>,
}

impl JobManager {
    pub fn new() -> Self {
        Self::default()
    }

    fn lock_state(&self) -> MutexGuard<'_, JobsState> {
        self.state
            .lock()
            .expect("JobManager.state poisoned; refusing to use possibly partial job state")
    }

    /// 启动顺序执行 worker。必须在 tauri setup 阶段调用一次。
    pub fn start(&self, app: AppHandle, core: Arc<Core>) -> std::io::Result<()> {
        self.app
            .set(app.clone())
            .map_err(|_| std::io::Error::other("job worker was already started"))?;
        let (tx, rx) = channel::<u64>();
        std::thread::Builder::new()
            .name("scoop-job-worker".into())
            .spawn(move || {
                while let Ok(id) = rx.recv() {
                    run_one(&app, &core, id);
                }
            })?;
        self.lock_state().tx = Some(tx);
        Ok(())
    }

    fn emit_changed(&self, dto: JobDto) {
        if let Some(app) = self.app.get() {
            let _ = app.emit("job-changed", dto);
        }
    }

    /// 空闲 → 排队中(flow 2.4.3-1)
    pub fn enqueue(
        &self,
        kind: JobKind,
        target: String,
        repo: Option<String>,
        script: Option<PathBuf>,
    ) -> Result<u64, String> {
        let dto;
        let id;
        {
            let mut st = self.lock_state();
            let tx = st.tx.as_ref().ok_or("job worker not started")?.clone();
            id = st.next_id.checked_add(1).ok_or("job id space exhausted")?;
            st.next_id = id;
            let job = Job {
                id,
                kind,
                target,
                repo,
                script,
                state: JobState::Queued,
                log: Vec::new(),
                exit_code: None,
                cancel_requested: false,
            };
            dto = job.dto();
            st.jobs.insert(id, job);
            if let Err(error) = tx.send(id) {
                st.jobs.remove(&id);
                return Err(error.to_string());
            }
        }
        self.emit_changed(dto);
        Ok(id)
    }

    /// 排队中/执行中 → 已取消(flow 2.4.3-5/6);实体回退由前端按状态机处理。
    pub fn cancel(&self, id: u64) -> Result<(), String> {
        self.cancel_with(id, kill_tree)
    }

    fn cancel_with(
        &self,
        id: u64,
        kill: impl FnOnce(u32) -> Result<(), String>,
    ) -> Result<(), String> {
        let mut to_kill: Option<u32> = None;
        let dto;
        {
            let mut st = self.lock_state();
            let pid = st.current_pid;
            let job = st.jobs.get_mut(&id).ok_or("job not found")?;
            match job.state {
                JobState::Queued => {
                    job.state = JobState::Cancelled;
                    dto = Some(job.dto());
                }
                JobState::Running => {
                    let Some(pid) = pid else {
                        return Err("job process has not started yet".into());
                    };
                    job.cancel_requested = true;
                    to_kill = Some(pid);
                    dto = None;
                }
                _ => return Ok(()), // 终态,无需处理
            }
        }
        if let Some(pid) = to_kill {
            if let Err(error) = kill(pid) {
                let mut st = self.lock_state();
                if let Some(job) = st.jobs.get_mut(&id) {
                    if job.state == JobState::Running {
                        job.cancel_requested = false;
                    } else {
                        // The worker completed while taskkill was running; its final state wins.
                        return Ok(());
                    }
                }
                return Err(error);
            }
        }
        if let Some(dto) = dto {
            self.emit_changed(dto);
        }
        Ok(())
    }

    pub fn list(&self) -> Vec<JobDto> {
        let st = self.lock_state();
        st.jobs.values().map(|j| j.dto()).collect()
    }

    pub fn log_of(&self, id: u64) -> Vec<String> {
        let st = self.lock_state();
        st.jobs.get(&id).map(|j| j.log.clone()).unwrap_or_default()
    }
}

impl Default for JobManager {
    fn default() -> Self {
        Self {
            state: Mutex::new(JobsState::default()),
            app: OnceLock::new(),
        }
    }
}

/// taskkill /T 杀掉 cmd → powershell → 下载器 的整棵进程树。
fn kill_tree(pid: u32) -> Result<(), String> {
    // 此调用会等待 taskkill;Tauri 命令适配层必须在 spawn_blocking 中调用。
    let status = Command::new("taskkill")
        .args(["/F", "/T", "/PID", &pid.to_string()])
        .creation_flags(CREATE_NO_WINDOW)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|error| format!("failed to start taskkill: {error}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("taskkill failed (exit {:?})", status.code()))
    }
}

/// 清理行内回车重绘(下载进度类输出),取最后一段非空内容。
fn sanitize_line(raw: &str) -> String {
    let no_ansi = crate::parse::strip_ansi(raw);
    let last = no_ansi
        .split('\r')
        .rfind(|s| !s.trim().is_empty())
        .unwrap_or("");
    last.trim_end().to_string()
}

fn build_command(core: &Core, job: &Job) -> Result<Command, String> {
    let shims = core
        .lock_scoop()
        .as_ref()
        .and_then(|env| env.shims_dir.clone());

    let cmd = match job.kind {
        JobKind::Install => scoop::scoop_command(&shims, &["install", &job.target]),
        JobKind::Uninstall => scoop::scoop_command(&shims, &["uninstall", &job.target]),
        JobKind::Update => scoop::scoop_command(&shims, &["update", &job.target]),
        JobKind::BucketAdd => match &job.repo {
            Some(repo) => scoop::scoop_command(&shims, &["bucket", "add", &job.target, repo]),
            None => scoop::scoop_command(&shims, &["bucket", "add", &job.target]),
        },
        JobKind::BucketRemove => scoop::scoop_command(&shims, &["bucket", "rm", &job.target]),
        JobKind::InstallScoop => {
            let script = job
                .script
                .as_ref()
                .ok_or("installer script missing for install-scoop job")?;
            let mut c = Command::new("powershell");
            c.args([
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
            ])
            .arg(script);
            scoop::apply_env(&mut c, &None);
            c
        }
    };
    Ok(cmd)
}

/// 执行单条任务:排队中 → 执行中 → 终态,全程推送事件。
fn run_one(app: &AppHandle, core: &Core, id: u64) {
    let jobs = &core.jobs;

    // 排队中 → 执行中(若已被取消则跳过)
    let dto = {
        let mut st = jobs.lock_state();
        let job = match st.jobs.get_mut(&id) {
            Some(j) => j,
            None => return,
        };
        if job.state != JobState::Queued {
            return;
        }
        job.state = JobState::Running;
        job.dto()
    };
    let _ = app.emit("job-changed", dto);

    let push_line = |line: String| {
        {
            let mut st = jobs.lock_state();
            if let Some(job) = st.jobs.get_mut(&id) {
                job.log.push(line.clone());
            }
        }
        let _ = app.emit("job-log", JobLogEvent { id, line });
    };

    // 构建并启动子进程
    let spawn_result = {
        let st = jobs.lock_state();
        match st.jobs.get(&id) {
            Some(job) => build_command(core, job),
            None => Err(format!("job {id} disappeared before process start")),
        }
    }
    .and_then(|mut cmd| {
        cmd.stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("failed to start process: {e}"))
    });

    let mut child = match spawn_result {
        Ok(c) => c,
        Err(e) => {
            push_line(format!("ERROR {e}"));
            let dto = {
                let mut st = jobs.lock_state();
                let Some(job) = st.jobs.get_mut(&id) else {
                    return;
                };
                job.state = JobState::Failed;
                job.dto()
            };
            let _ = app.emit("job-changed", dto);
            return;
        }
    };

    {
        let mut st = jobs.lock_state();
        st.current_pid = Some(child.id());
    }

    // stdout / stderr 双线程逐行汇聚
    let (line_tx, line_rx) = channel::<String>();
    let mut readers = Vec::new();
    if let Some(stdout) = child.stdout.take() {
        let tx = line_tx.clone();
        readers.push(std::thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                let _ = tx.send(line);
            }
        }));
    }
    if let Some(stderr) = child.stderr.take() {
        let tx = line_tx.clone();
        readers.push(std::thread::spawn(move || {
            for line in BufReader::new(stderr).lines().map_while(Result::ok) {
                let _ = tx.send(line);
            }
        }));
    }
    drop(line_tx);

    for raw in line_rx {
        let line = sanitize_line(&raw);
        if !line.is_empty() {
            push_line(line);
        }
    }
    for r in readers {
        let _ = r.join();
    }

    let status = child.wait();

    let dto = {
        let mut st = jobs.lock_state();
        st.current_pid = None;
        let Some(job) = st.jobs.get_mut(&id) else {
            return;
        };
        let exit_code = status.as_ref().ok().and_then(|s| s.code());
        job.exit_code = exit_code;
        job.state = if job.cancel_requested {
            JobState::Cancelled
        } else {
            match status {
                Ok(s) if s.success() => JobState::Succeeded,
                _ => JobState::Failed,
            }
        };
        job.dto()
    };
    let _ = app.emit("job-changed", dto);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc::Receiver;

    fn queued_manager() -> (JobManager, Receiver<u64>) {
        let manager = JobManager::new();
        let (tx, rx) = channel();
        manager.state.lock().unwrap().tx = Some(tx);
        (manager, rx)
    }

    fn job(id: u64, state: JobState) -> Job {
        Job {
            id,
            kind: JobKind::Install,
            target: "git".into(),
            repo: None,
            script: None,
            state,
            log: Vec::new(),
            exit_code: None,
            cancel_requested: false,
        }
    }

    #[test]
    fn enqueue_without_worker_does_not_leave_a_ghost_job() {
        let manager = JobManager::new();

        let result = manager.enqueue(JobKind::Install, "git".into(), None, None);

        assert_eq!(result, Err("job worker not started".into()));
        assert!(manager.list().is_empty());
    }

    #[test]
    fn enqueue_with_disconnected_worker_removes_the_unscheduled_job() {
        let manager = JobManager::new();
        let (tx, rx) = channel();
        manager.state.lock().unwrap().tx = Some(tx);
        drop(rx);

        let result = manager.enqueue(JobKind::Install, "git".into(), None, None);

        assert_eq!(result, Err("sending on a disconnected channel".into()));
        assert!(manager.list().is_empty());
    }

    #[test]
    fn cancelling_queued_job_marks_it_cancelled_without_killing_a_process() {
        let (manager, rx) = queued_manager();
        let id = manager
            .enqueue(JobKind::Install, "git".into(), None, None)
            .unwrap();
        assert_eq!(rx.try_recv(), Ok(id));

        manager
            .cancel_with(id, |_| {
                panic!("queued cancellation must not kill a process")
            })
            .unwrap();

        assert_eq!(manager.list()[0].state, JobState::Cancelled);
    }

    #[test]
    fn cancelling_running_job_records_intent_and_signals_the_process_tree() {
        let manager = JobManager::new();
        let id = 7;
        let pid = 4242;
        {
            let mut state = manager.state.lock().unwrap();
            state.current_pid = Some(pid);
            state.jobs.insert(id, job(id, JobState::Running));
        }
        let mut signalled_pid = None;

        manager
            .cancel_with(id, |value| {
                signalled_pid = Some(value);
                Ok(())
            })
            .unwrap();

        assert_eq!(signalled_pid, Some(pid));
        let state = manager.state.lock().unwrap();
        let job = state.jobs.get(&id).unwrap();
        assert!(job.cancel_requested);
        assert_eq!(job.state, JobState::Running);
    }

    #[test]
    fn cancelling_running_job_before_process_start_returns_an_error() {
        let manager = JobManager::new();
        manager
            .lock_state()
            .jobs
            .insert(1, job(1, JobState::Running));

        let result = manager.cancel_with(1, |_| Ok(()));

        assert_eq!(result, Err("job process has not started yet".into()));
        assert!(!manager.lock_state().jobs[&1].cancel_requested);
    }

    #[test]
    fn failed_process_tree_kill_clears_cancel_intent_and_returns_the_error() {
        let manager = JobManager::new();
        let id = 7;
        {
            let mut state = manager.lock_state();
            state.current_pid = Some(4242);
            state.jobs.insert(id, job(id, JobState::Running));
        }

        let result = manager.cancel_with(id, |_| Err("taskkill failed".into()));

        assert_eq!(result, Err("taskkill failed".into()));
        assert!(!manager.lock_state().jobs[&id].cancel_requested);
    }

    #[test]
    fn cancelling_terminal_job_is_a_no_op() {
        let manager = JobManager::new();
        manager
            .state
            .lock()
            .unwrap()
            .jobs
            .insert(1, job(1, JobState::Succeeded));

        manager
            .cancel_with(1, |_| {
                panic!("terminal cancellation must not kill a process")
            })
            .unwrap();

        assert_eq!(manager.list()[0].state, JobState::Succeeded);
    }
}
