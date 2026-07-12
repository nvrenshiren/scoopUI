import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BucketInfo, KnownBucket, OkResult, IPCResult, IPCError } from '../../../../../shared/ipc-contract';
export type { BucketInfo } from '../../../../../shared/ipc-contract';

const KEY_ADDED = ['buckets', 'added'] as const;
const KEY_KNOWN = ['buckets', 'known'] as const;

function unwrap<T>(result: IPCResult<T>, fallbackMessage: string): T {
  if (result.ok) return result.data;
  const err: IPCError = result.error;
  const message = err?.message || fallbackMessage;
  const error = new Error(message) as Error & { code?: string; cause?: unknown };
  if (err?.code) error.code = err.code;
  if (err?.cause !== undefined) error.cause = err.cause;
  throw error;
}

export interface UseAddedBucketsResult {
  buckets: BucketInfo[];
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useAddedBuckets(): UseAddedBucketsResult {
  const query = useQuery({
    queryKey: KEY_ADDED,
    queryFn: async () => {
      const res = await window.scoop.listBuckets();
      return unwrap<BucketInfo[]>(res, 'failed to load added buckets');
    },
    staleTime: 30_000,
  });

  return {
    buckets: query.data ?? [],
    error: query.error as Error | null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export interface UseKnownBucketsResult {
  buckets: KnownBucket[];
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

export function useKnownBuckets(): UseKnownBucketsResult {
  const query = useQuery({
    queryKey: KEY_KNOWN,
    queryFn: async () => {
      const res = await window.scoop.knownBuckets();
      return unwrap<KnownBucket[]>(res, 'failed to load known buckets');
    },
    staleTime: 60_000,
  });

  return {
    buckets: query.data ?? [],
    error: query.error as Error | null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export interface UseAddBucketMutation {
  mutate: (input: { name: string; repo?: string }) => Promise<OkResult>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

export function useAddBucket(): UseAddBucketMutation {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: { name: string; repo?: string }) => {
      const res = await window.scoop.addBucket(input);
      return unwrap<OkResult>(res, 'add bucket failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY_ADDED });
      void qc.invalidateQueries({ queryKey: KEY_KNOWN });
    },
  });

  return {
    mutate: async (input) => {
      if (!mutation.isIdle) {
        throw new Error('add bucket already in progress');
      }
      return mutation.mutateAsync(input);
    },
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: () => mutation.reset(),
  };
}

export interface UseRemoveBucketMutation {
  mutate: (input: { name: string }) => Promise<OkResult>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

export function useRemoveBucket(): UseRemoveBucketMutation {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: { name: string }) => {
      const res = await window.scoop.removeBucket(input);
      return unwrap<OkResult>(res, 'remove bucket failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY_ADDED });
      void qc.invalidateQueries({ queryKey: KEY_KNOWN });
    },
  });

  return {
    mutate: async (input) => {
      if (!mutation.isIdle) {
        throw new Error('remove bucket already in progress');
      }
      return mutation.mutateAsync(input);
    },
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
    reset: () => mutation.reset(),
  };
}

export interface KnownBucketRow {
  name: string;
  repo?: string;
  added: boolean;
}

export function mergeKnownWithAdded(known: KnownBucket[], added: BucketInfo[]): KnownBucketRow[] {
  const addedNames = new Set(added.map((b) => b.name));
  return known.map((k) => ({ name: k.name, repo: k.repo, added: addedNames.has(k.name) }));
}

export function countAddable(rows: KnownBucketRow[]): number {
  return rows.reduce((acc, r) => acc + (r.added ? 0 : 1), 0);
}