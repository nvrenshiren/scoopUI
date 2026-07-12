import { z } from 'zod';
import type { ErrorCode as ErrorCodeT } from './enums';

/** IPC 错误形态,Tech.md §4.1 */
export interface IPCError {
  code: ErrorCodeT;
  message: string;
  cause?: unknown;
}

/** IPC 统一返回壳,Tech.md §4.1 */
export type IPCResult<T> = { ok: true; data: T } | { ok: false; error: IPCError };

/** 类型守卫:成功 */
export function isOk<T>(r: IPCResult<T>): r is { ok: true; data: T } {
  return r.ok === true;
}

/** 类型守卫:失败 */
export function isErr<T>(r: IPCResult<T>): r is { ok: false; error: IPCError } {
  return r.ok === false;
}

/** 工厂:成功 */
export function ok<T>(data: T): IPCResult<T> {
  return { ok: true, data };
}

/** 工厂:失败 */
export function err(
  code: ErrorCodeT,
  message: string,
  cause?: unknown,
): IPCResult<never> {
  return {
    ok: false,
    error: { code, message, ...(cause !== undefined ? { cause } : {}) },
  };
}

/** 工厂:从 zod 校验失败生成 IPCError */
export function errFromZod(input: unknown): IPCResult<never> {
  return {
    ok: false,
    error: {
      code: 'E_IPC_INVALID_INPUT',
      message: 'Invalid IPC input',
      cause: input,
    },
  };
}
