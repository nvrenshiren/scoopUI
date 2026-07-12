/**
 * child_process.spawn 封装 + 流式行缓冲 + 进度推送
 * 单一出处:ARCHITECTURE.md §4(command-runner 边界)
 *
 * 真实实现路径:
 *   1. spawn('scoop', [...args], { env: { ...process.env, PATH: prependShims(...) } })
 *   2. 按行 readline 解析 → parseProgressLine → ProgressChunk
 *   3. 通过 onProgress 回调推送给 jobManager
 *   4. 超时(TIMEOUT_MS)、子进程异常、退出码非 0 各自映射到 ErrorCode
 *
 * 本期不实际 spawn(MVP 阶段 mock),仅暴露 interface,后续命令替换
 */

import { EventEmitter } from 'node:events';
import type { ProgressChunk } from '../../shared/ipc-contract';

export interface CommandRunnerOptions {
  /** 命令二进制名(spawn 不走 shell) */
  command: string;
  /** 参数数组 */
  args: string[];
  /** 额外环境变量(覆盖 PATH) */
  env?: NodeJS.ProcessEnv;
  /** 超时(默认 10 分钟) */
  timeoutMs?: number;
}

export interface CommandRunnerEvents {
  /** 每解析出一行进度行触发 */
  progress: (chunk: ProgressChunk) => void;
  /** 子进程退出(0 = 成功,其他 = 失败) */
  exit: (exitCode: number, stderrTail: string) => void;
  /** 异常(无法 spawn / 超时 / 解析失败) */
  error: (code: string, message: string, cause?: unknown) => void;
}

export class CommandRunner extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly opts: CommandRunnerOptions) {
    super();
  }

  /**
   * 启动子进程(本期 stub:不调用真实 spawn,只在 nextTick 推送 mock 进度行)
   * 后续阶段:真实 spawn + readline 解析
   */
  start(): void {
    const timeoutMs = this.opts.timeoutMs ?? 10 * 60 * 1000;
    this.timer = setTimeout(() => {
      this.emit('error', 'E_SCOOP_INSTALL_TIMEOUT', `${this.opts.command} 超时(${timeoutMs}ms)`);
    }, timeoutMs);

    queueMicrotask(() => {
      try {
        // 推送一行 mock 进度,证明通道通畅
        this.emit('progress', {
          raw: `${this.opts.command} ${this.opts.args.join(' ')} (mock)`,
          stage: 'message',
          percent: 10,
        });
        // 后续真实实现:监听 child.stdout on('data') → split('\n') → emit progress
        queueMicrotask(() => {
          this.emit('exit', 0, '');
        });
      } catch (cause) {
        this.emit('error', 'E_SCOOP_SPAWN_FAILED', 'spawn failed', cause);
      }
    });
  }

  abort(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // 后续阶段:child.kill('SIGTERM')
    this.emit('exit', 130, 'aborted');
  }

  override on<K extends keyof CommandRunnerEvents>(event: K, listener: CommandRunnerEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override emit<K extends keyof CommandRunnerEvents>(event: K, ...args: Parameters<CommandRunnerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}

/**
 * 解析单行 scoop 输出为 ProgressChunk(详细正则见 acceptance/scoop-cli-reference.md §3 + 后续样本)
 * 本期保守实现:仅识别 "Downloading..." / "Installing..." / "Extracting..." 等关键字
 */
export function parseProgressLine(raw: string): ProgressChunk | null {
  const line = raw.trim();
  if (!line) return null;

  const lower = line.toLowerCase();
  if (lower.startsWith('downloading')) {
    const pctMatch = /(\d{1,3})%/.exec(line);
    return {
      raw: line,
      stage: 'downloading',
      ...(pctMatch?.[1] ? { percent: Number(pctMatch[1]) } : {}),
    };
  }
  if (lower.startsWith('extracting')) {
    return { raw: line, stage: 'extracting' };
  }
  if (lower.startsWith('installing')) {
    return { raw: line, stage: 'installing' };
  }
  if (lower.startsWith('uninstalling')) {
    return { raw: line, stage: 'uninstalling' };
  }
  if (lower.startsWith('updating')) {
    return { raw: line, stage: 'updating' };
  }
  if (lower.startsWith('cloning')) {
    return { raw: line, stage: 'cloning' };
  }
  if (lower.startsWith('removing')) {
    return { raw: line, stage: 'removing' };
  }
  return { raw: line, stage: 'message' };
}

/** 退出码枚举(acceptance/scoop-cli-reference.md §5) */
export function detectExitCode(err: unknown): number {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'number') {
    return (err as { code: number }).code;
  }
  if (err && typeof err === 'object' && 'errno' in err && typeof (err as { errno: unknown }).errno === 'number') {
    return (err as { errno: number }).errno;
  }
  return 1;
}
