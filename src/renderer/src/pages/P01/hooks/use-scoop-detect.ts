import { useQuery } from '@tanstack/react-query';
import type { ScoopAPI } from '../../../../../preload/api';

type DetectResult = Awaited<ReturnType<ScoopAPI['detect']>>;
export type ScoopDetectData = Extract<DetectResult, { ok: true }>['data'];
type ScoopDetectIPCError = Extract<DetectResult, { ok: false }>['error'];

export class ScoopDetectQueryError extends Error {
  readonly code: ScoopDetectIPCError['code'];

  constructor(error: ScoopDetectIPCError) {
    super(error.message, { cause: error.cause });
    this.name = 'ScoopDetectQueryError';
    this.code = error.code;
  }
}

async function detectScoop(): Promise<ScoopDetectData> {
  if (!window.scoop?.detect) {
    throw new Error('window.scoop.detect is unavailable');
  }

  const result = await window.scoop.detect();

  if (!result.ok) {
    throw new ScoopDetectQueryError(result.error);
  }

  return result.data;
}

export function useScoopDetect() {
  const query = useQuery<ScoopDetectData, Error>({
    queryKey: ['scoop', 'detect'],
    queryFn: detectScoop,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
