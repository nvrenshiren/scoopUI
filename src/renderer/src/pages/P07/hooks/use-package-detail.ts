import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AppDetail, IPCResult } from '../../../../../shared/ipc-contract';

export const PACKAGE_DETAIL_QUERY_KEY = 'scoop:apps:info' as const;

export interface PackageDetailError {
  code: string;
  message: string;
}

async function fetchPackage(name: string): Promise<AppDetail> {
  if (typeof window === 'undefined' || !window.scoop) {
    throw new Error('scoop bridge unavailable');
  }
  const result: IPCResult<AppDetail | null> = await window.scoop.getPackage(name);
  if (!result.ok) {
    const err: PackageDetailError = { code: result.error.code, message: result.error.message };
    throw err;
  }
  if (result.data === null) {
    throw { code: 'E_SCOOP_PACKAGE_NOT_FOUND', message: `package "${name}" not found` } satisfies PackageDetailError;
  }
  return result.data;
}

export interface UsePackageDetailResult {
  detail: AppDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  error: PackageDetailError | null;
  refetch: UseQueryResult<AppDetail, Error>['refetch'];
}

export function usePackageDetail(name: string | null): UsePackageDetailResult {
  const enabled = typeof name === 'string' && name.length > 0;
  const query = useQuery<AppDetail, Error>({
    queryKey: [PACKAGE_DETAIL_QUERY_KEY, name],
    queryFn: () => fetchPackage(name as string),
    enabled,
    retry: 1,
    staleTime: 30_000,
  });

  let derivedError: PackageDetailError | null = null;
  if (query.error) {
    const e = query.error as unknown;
    if (e && typeof e === 'object' && 'code' in e && 'message' in e) {
      derivedError = { code: String((e as PackageDetailError).code), message: String((e as PackageDetailError).message) };
    } else {
      derivedError = { code: 'E_SCOOP_QUERY_FAILED', message: query.error.message };
    }
  }

  return {
    detail: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: derivedError,
    refetch: query.refetch,
  };
}