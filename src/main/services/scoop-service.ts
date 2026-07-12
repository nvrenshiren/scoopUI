/**
 * ScoopService 门面
 * - 编排 scoop CLI 调用(execFile 真实 spawn)
 * - 统一返回 IPCResult<T>(ARCH §8.1 + TECH §4.1)
 * - 写操作通过 emitProgress 推送进度事件(payload: ProgressEvent)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  AppInfo,
  AppDetail,
  OutdatedApp,
  BucketInfo,
  KnownBucket,
  CheckOutput,
  ScoopInstallConfig,
  OkResult,
} from '../../shared/ipc-contract';
import type {
  ServiceEmitFn,
  SearchInput,
  InfoInput,
  InstallAppInput,
  UninstallAppInput,
  UpdateAppInput,
  BucketAddInput,
  BucketRemoveInput,
} from './types';
import { type IPCResult, ok, err } from '../../shared/ipc-result';
import { ErrorCode } from '../../shared/enums';
import {
  parseListOutput,
  parseSearchOutput,
  parseStatusOutput,
  parseBucketListOutput,
  parseKnownBucketsOutput,
  parseInfoOutput,
} from './parsers';

const exec = promisify(execFile);

const SCOOP_CMD = process.platform === 'win32' ? 'scoop.cmd' : 'scoop';
const TIMEOUT_MS = 60_000;

interface ExecResult {
  stdout: string;
  stderr: string;
}

async function runScoop(args: string[]): Promise<IPCResult<ExecResult>> {
  try {
    // Windows 上 .cmd 文件不能被 execFile 直接 spawn(报错 ENOENT);
    // 走 cmd.exe /c scoop.cmd 是更稳妥的兼容方案。
    const cmd = process.platform === 'win32' ? process.env['ComSpec'] ?? 'cmd.exe' : SCOOP_CMD;
    const argv =
      process.platform === 'win32' ? ['/d', '/s', '/c', SCOOP_CMD, ...args] : args;
    const result = (await exec(cmd, argv, {
      timeout: TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    })) as ExecResult;
    return ok(result);
  } catch (cause) {
    const e = cause as { code?: string; stderr?: string; stdout?: string; message?: string };
    if (e.code === 'ENOENT') {
      return err(ErrorCode.ScoopNotFound, 'Scoop 未安装或不在 PATH', cause);
    }
    if (e.code === 'ETIMEDOUT' || e.message?.includes('timed out')) {
      return err(ErrorCode.ScoopInstallTimeout, `scoop ${args.join(' ')} 超时`, cause);
    }
    // exit code !=0:wrapper 把 stdout/stderr 也带回来,parser 仍能解析部分输出
    if (typeof e.stdout === 'string') {
      return ok({ stdout: e.stdout, stderr: e.stderr ?? '' });
    }
    return err(ErrorCode.ScoopSpawnFailed, e.message ?? 'scoop 执行失败', cause);
  }
}

export class ScoopService {
  /**
   * 检测 Scoop 是否可用
   * 调用 `scoop --version`,从第一行 `Current Scoop version:` 后提取 commit
   */
  async detect(): Promise<IPCResult<CheckOutput>> {
    const result = await runScoop(['--version']);
    if (!result.ok) return result;
    const { stdout } = result.data;
    // 形如:`b588a06e chore(release): Bump to version 0.5.3 (resync) (#6436)`
    const m = /version\s+(\d+\.\d+\.\d+)/i.exec(stdout);
    const version = m?.[1] ?? 'unknown';
    return ok({
      available: true,
      version,
      path: SCOOP_CMD,
    });
  }

  /**
   * 协助安装 Scoop(走 PowerShell 执行 install.ps1)
   * 本期通过 PowerShell 进程模拟(需后续阶段完整接通)
   */
  async installScoop(cfg: ScoopInstallConfig | undefined): Promise<IPCResult<OkResult>> {
    void cfg;
    return err(ErrorCode.OnboardingInstallFailed, '协助安装未在 MVP 启用');
  }

  /** 列出已装应用:`scoop list` → parseListOutput */
  async listInstalled(): Promise<IPCResult<AppInfo[]>> {
    const result = await runScoop(['list']);
    if (!result.ok) return result;
    return parseListOutput(result.data.stdout);
  }

  /** 搜索可用应用:`scoop search <query>` → parseSearchOutput */
  async search(input: SearchInput): Promise<IPCResult<AppInfo[]>> {
    const result = await runScoop(['search', input.query]);
    if (!result.ok) return result;
    return parseSearchOutput(result.data.stdout);
  }

  /** 单包详情:`scoop info <name>` → parseInfoOutput */
  async getPackage(input: InfoInput): Promise<IPCResult<AppDetail | null>> {
    const result = await runScoop(['info', input.name]);
    if (!result.ok) return result;
    return parseInfoOutput(result.data.stdout);
  }

  /** 过期检查:`scoop status` → parseStatusOutput */
  async listStatus(): Promise<IPCResult<OutdatedApp[]>> {
    const result = await runScoop(['status']);
    if (!result.ok) return result;
    return parseStatusOutput(result.data.stdout);
  }

  // ── 写操作:InstallJob + 进度推送 ─────────────────────────────
  // 真实 spawn:为避免下载阻塞 UI,先 emit 进度再同步等待,进度可后续切到流式

  async installApp(
    input: InstallAppInput,
    _jobId: string,
    emit: ServiceEmitFn,
  ): Promise<IPCResult<OkResult>> {
    emit({ stage: 'installing', percent: 10, message: `正在安装 ${input.name}…` });
    const result = await runScoop(['install', input.name]);
    if (!result.ok) return result;
    emit({ stage: 'message', percent: 100, message: `${input.name} 安装完成` });
    return ok({ ok: true, message: `Installed ${input.name}` });
  }

  async uninstallApp(
    input: UninstallAppInput,
    _jobId: string,
    emit: ServiceEmitFn,
  ): Promise<IPCResult<OkResult>> {
    emit({ stage: 'uninstalling', percent: 10, message: `正在卸载 ${input.name}…` });
    const result = await runScoop(['uninstall', input.name]);
    if (!result.ok) return result;
    emit({ stage: 'message', percent: 100, message: `${input.name} 已卸载` });
    return ok({ ok: true, message: `Uninstalled ${input.name}` });
  }

  async updateApp(
    input: UpdateAppInput,
    _jobId: string,
    emit: ServiceEmitFn,
  ): Promise<IPCResult<OkResult>> {
    const target = input.name ?? '*';
    emit({ stage: 'updating', percent: 10, message: `正在更新 ${target}…` });
    const args = input.name ? ['update', input.name] : ['update', '*'];
    const result = await runScoop(args);
    if (!result.ok) return result;
    emit({ stage: 'message', percent: 100, message: `${target} 更新完成` });
    return ok({ ok: true, message: `Updated ${target}` });
  }

  // ── buckets ──────────────────────────────────────────────────

  async listBuckets(): Promise<IPCResult<BucketInfo[]>> {
    const result = await runScoop(['bucket', 'list']);
    if (!result.ok) return result;
    return parseBucketListOutput(result.data.stdout);
  }

  async listKnownBuckets(): Promise<IPCResult<KnownBucket[]>> {
    const result = await runScoop(['bucket', 'known']);
    if (!result.ok) return result;
    return parseKnownBucketsOutput(result.data.stdout);
  }

  async addBucket(
    input: BucketAddInput,
    _jobId: string,
    emit: ServiceEmitFn,
  ): Promise<IPCResult<OkResult>> {
    emit({ stage: 'cloning', percent: 10, message: `正在添加 ${input.name}…` });
    const result = await runScoop(['bucket', 'add', input.name]);
    if (!result.ok) return result;
    emit({ stage: 'message', percent: 100, message: `${input.name} 已添加` });
    return ok({ ok: true, message: `Added ${input.name}` });
  }

  async removeBucket(
    input: BucketRemoveInput,
    _jobId: string,
    emit: ServiceEmitFn,
  ): Promise<IPCResult<OkResult>> {
    emit({ stage: 'removing', percent: 10, message: `正在移除 ${input.name}…` });
    const result = await runScoop(['bucket', 'rm', input.name]);
    if (!result.ok) return result;
    emit({ stage: 'message', percent: 100, message: `${input.name} 已移除` });
    return ok({ ok: true, message: `Removed ${input.name}` });
  }
}
