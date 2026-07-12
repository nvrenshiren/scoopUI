/**
 * JobManager
 * - 并发控制:MAX_PARALLEL_JOBS = 1(本期,不暴露多任务并行,避免 scoop 自身行为冲突)
 * - 取消:支持取消(emit cancelled state)
 * - 超时:command-runner 内部计时
 * - jobId 生成:UUID v4
 *
 * 与 IPC 关联:
 * - startJob({ sourceChannel, run }):启动一个 job,run 接收 (jobId, emit) → 返回 IPCResult
 * - 通过 webContents.send 发送 ProgressEvent
 */

import { randomUUID } from 'node:crypto';
import type { BrowserWindow } from 'electron';
import type {
  IPCError,
  IPCResult,
  OkResult,
  ProgressChunk,
  ProgressEvent as IpcProgressEvent,
  IpcChannelName,
} from '../../shared/ipc-contract';
import type { ServiceEmitFn } from './types';
import { toProgressChunk } from './types';
import { type InstallJobState } from '../../shared/enums';
import { ok, err } from '../../shared/ipc-result';
import { ErrorCode } from '../../shared/enums';
import { WindowManager } from '../window-manager';
import { deriveProgressChannel } from '../progress-emitter';

export const MAX_PARALLEL_JOBS = 1;

interface JobRequest<TInput> {
  sourceChannel: IpcChannelName;
  input: TInput;
  run: (jobId: string, emit: ServiceEmitFn) => Promise<IPCResult<OkResult>>;
}

interface RunningJob {
  jobId: string;
  sourceChannel: IpcChannelName;
  state: InstallJobState;
  cancel: () => void;
}

export class JobManager {
  private static instance: JobManager | null = null;
  private runningJobs = new Map<string, RunningJob>();
  private cancelledJobs = new Set<string>();

  static getInstance(): JobManager {
    if (!JobManager.instance) JobManager.instance = new JobManager();
    return JobManager.instance;
  }

  private getWindow(): BrowserWindow | null {
    const wm = WindowManager.getInstance();
    return wm ? wm.getMainWindow() : null;
  }

  private sendProgress(event: IpcProgressEvent, sourceChannel: string): void {
    const win = this.getWindow();
    if (!win || win.isDestroyed()) return;
    const channel = deriveProgressChannel(sourceChannel);
    if (!channel) return;
    win.webContents.send(channel, event);
  }

  private emitState(
    jobId: string,
    sourceChannel: IpcChannelName,
    state: InstallJobState,
    extra?: { chunk?: ProgressChunk; error?: IPCError },
  ): void {
    this.sendProgress(
      {
        jobId,
        channel: sourceChannel,
        state,
        ts: Date.now(),
        ...(extra?.chunk ? { chunk: extra.chunk } : {}),
        ...(extra?.error ? { error: extra.error } : {}),
      },
      sourceChannel,
    );
  }

  async startJob<TInput>(req: JobRequest<TInput>): Promise<IPCResult<OkResult>> {
    // 并发控制:超过上限直接入队返回 queued
    if (this.runningJobs.size >= MAX_PARALLEL_JOBS) {
      // 简化:不实现队列,直接返回失败(MVP 单任务)
      return err(ErrorCode.ScoopInstallFailed, 'Job manager: 任务已在执行(本期 MAX_PARALLEL_JOBS=1)');
    }

    const jobId = randomUUID();
    const cancelled = () => this.cancelledJobs.add(jobId);

    const entry: RunningJob = {
      jobId,
      sourceChannel: req.sourceChannel,
      state: 'queued',
      cancel: cancelled,
    };
    this.runningJobs.set(jobId, entry);

    this.emitState(jobId, req.sourceChannel, 'running');
    entry.state = 'running';

    try {
      const result = await req.run(jobId, (lite) => {
        if (this.cancelledJobs.has(jobId)) return;
        const chunk = toProgressChunk(lite);
        this.sendProgress(
          {
            jobId,
            channel: req.sourceChannel,
            state: 'running',
            chunk,
            ts: Date.now(),
          },
          req.sourceChannel,
        );
      });

      // 取消优先级高于内部结果
      if (this.cancelledJobs.has(jobId)) {
        this.emitState(jobId, req.sourceChannel, 'cancelled', {
          error: { code: ErrorCode.JobCancelled, message: 'cancelled by user' },
        });
        return err(ErrorCode.JobCancelled, '任务已取消');
      }

      if (result.ok) {
        this.emitState(jobId, req.sourceChannel, 'succeeded');
        return ok({ ok: true, message: result.data.message });
      }
      this.emitState(jobId, req.sourceChannel, 'failed', {
        error: result.error,
      });
      return result;
    } catch (cause) {
      this.emitState(jobId, req.sourceChannel, 'failed', {
        error: {
          code: ErrorCode.ScoopInstallFailed,
          message: 'Internal handler error',
          cause,
        },
      });
      return err(ErrorCode.ScoopInstallFailed, 'Internal handler error', cause);
    } finally {
      this.runningJobs.delete(jobId);
      this.cancelledJobs.delete(jobId);
    }
  }

  cancel(jobId: string): void {
    const job = this.runningJobs.get(jobId);
    if (!job) return;
    job.cancel();
  }

  isRunning(jobId: string): boolean {
    return this.runningJobs.has(jobId);
  }

  getActiveJobs(): RunningJob[] {
    return [...this.runningJobs.values()];
  }
}
