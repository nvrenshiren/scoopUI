import type { ProgressChunk, ProgressStage } from '../../shared/ipc-contract';

/** 服务层 emit 函数的简化入参(外部不用关心 jobId/ts/channel 编排) */
export interface ProgressEventLite {
  stage: ProgressStage;
  raw?: string;
  percent?: number;
  url?: string;
  bytes?: number;
  message?: string;
}

export function toProgressChunk(e: ProgressEventLite): ProgressChunk {
  return {
    raw: e.raw ?? e.message ?? e.stage,
    stage: e.stage,
    ...(e.percent !== undefined ? { percent: e.percent } : {}),
    ...(e.url !== undefined ? { url: e.url } : {}),
    ...(e.bytes !== undefined ? { bytes: e.bytes } : {}),
  };
}

/** scoopservice 调用的 emit 函数,接收简化入参,内部转 ProgressChunk */
export type ServiceEmitFn = (event: ProgressEventLite) => void;

/** scoopservice 内部 emit 助手 */
export function buildChunk(e: ProgressEventLite): ProgressChunk {
  return toProgressChunk(e);
}

// 业务入参类型别名(避免大 import)
export interface SearchInput {
  query: string;
}
export interface InfoInput {
  name: string;
}
export interface InstallAppInput {
  name: string;
  bucket?: string;
  global: boolean;
}
export interface UninstallAppInput {
  name: string;
  global: boolean;
}
export interface UpdateAppInput {
  name?: string;
  global: boolean;
}
export interface BucketAddInput {
  name: string;
  repo?: string;
}
export interface BucketRemoveInput {
  name: string;
}

// 进度事件 = ProgressChunk + 元信息
export interface ProgressEvent extends ProgressChunk {}
