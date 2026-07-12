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
use std::sync::{Arc, Mutex, OnceLock};

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
        Self {
            state: Mutex::new(JobsState::default()),
            app: OnceLock::new(),
        }
    }

    /// 启动顺序执行 worker。必须在 tauri setup 阶段调用一次。
    pub fn start(&self, app: AppHandle, core: Arc<Core>) {
        let (tx, rx) = channel::<u64>();
        {
            let mut st = self.state.lock().unwrap();
            st.tx = Some(tx);
        }
        let _ = self.app.set(app.clone());
        std::thread::spawn(move || {
            while let Ok(id) = rx.recv() {
                run_one(&app, &core, id);
            }
        });
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
            let mut st = self.state.lock().unwrap();
            st.next_id += 1;
            id = st.next_id;
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
            let tx = st.tx.as_ref().ok_or("job worker not started")?;
            tx.send(id).map_err(|e| e.to_string())?;
        }
        self.emit_changed(dto);
        Ok(id)
    }

    /// 排队中/执行中 → 已取消(flow 2.4.3-5/6);实体回退由前端按状态机处理。
    pub fn cancel(&self, id: u64) -> Result<(), String> {
        let mut to_kill: Option<u32> = None;
        let dto;
        {
            let mut st = self.state.lock().unwrap();
            let pid = st.current_pid;
            let job = st.jobs.get_mut(&id).ok_or("job not found")?;
            match job.state {
                JobState::Queued => {
                    job.state = JobState::Cancelled;
                    dto = Some(job.dto());
                }
                JobState::Running => {
                    job.cancel_requested = true;
                    to_kill = pid;
                    dto = None;
                }
                _ => return Ok(()), // 终态,无需处理
            }
        }
        if let Some(pid) = to_kill {
            kill_tree(pid);
        }
        if let Some(dto) = dto {
            self.emit_changed(dto);
        }
        Ok(())
    }

    pub fn list(&self) -> Vec<JobDto> {
        let st = self.state.lock().unwrap();
        st.jobs.values().map(|j| j.dto()).collect()
    }

    pub fn log_of(&self, id: u64) -> Vec<String> {
        let st = self.state.lock().unwrap();
        st.jobs.get(&id).map(|j| j.log.clone()).unwrap_or_default()
    }
}

/// taskkill /T 杀掉 cmd → powershell → 下载器 的整棵进程树。
fn kill_tree(pid: u32) {
    let _ = Command::new("taskkill")
        .args(["/F", "/T", "/PID", &pid.to_string()])
        .creation_flags(CREATE_NO_WINDOW)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();
}

/// 清理行内回车重绘(下载进度类输出),取最后一段非空内容。
fn sanitize_line(raw: &str) -> String {
    let no_ansi = crate::parse::strip_ansi(raw);
    let last = no_ansi
        .split('\r')
        .filter(|s| !s.trim().is_empty())
        .last()
        .unwrap_or("");
    last.trim_end().to_string()
}

fn build_command(core: &Core, job: &Job) -> Result<Command, String> {
    let shims = core
        .scoop
        .lock()
        .unwrap()
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
            c.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"])
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
        let mut st = jobs.state.lock().unwrap();
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
            let mut st = jobs.state.lock().unwrap();
            if let Some(job) = st.jobs.get_mut(&id) {
                job.log.push(line.clone());
            }
        }
        let _ = app.emit("job-log", JobLogEvent { id, line });
    };

    // 构建并启动子进程
    let spawn_result = {
        let st = jobs.state.lock().unwrap();
        let job = st.jobs.get(&id).unwrap();
        build_command(core, job)
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
                let mut st = jobs.state.lock().unwrap();
                let job = st.jobs.get_mut(&id).unwrap();
                job.state = JobState::Failed;
                job.dto()
            };
            let _ = app.emit("job-changed", dto);
            return;
        }
    };

    {
        let mut st = jobs.state.lock().unwrap();
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
        let mut st = jobs.state.lock().unwrap();
        st.current_pid = None;
        let job = st.jobs.get_mut(&id).unwrap();
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
