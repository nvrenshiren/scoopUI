import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AppInfo, IPCResult } from '../../../../../shared/ipc-contract';
import { lookup, type Locale } from '../locales';

export const INSTALLED_PACKAGES_QUERY_KEY = 'scoop:apps:listInstalled' as const;

export type OutdatedInfo = {
  latest: string;
  isOutdated: true;
};

export type InstalledPackage = AppInfo & {
  /** Outdated enrichment. `undefined` when up-to-date or unknown. */
  outdated?: OutdatedInfo;
};

export interface InstalledPackagesError {
  code: string;
  message: string;
}

async function fetchInstalledPackages(): Promise<InstalledPackage[]> {
  if (typeof window === 'undefined' || !window.scoop) {
    throw new Error('scoop bridge unavailable');
  }
  const result: IPCResult<AppInfo[]> = await window.scoop.listInstalled();
  if (!result.ok) {
    const err: InstalledPackagesError = { code: result.error.code, message: result.error.message };
    throw err;
  }
  return result.data.map(enrichOutdated);
}

/**
 * MVP outdated enrichment.
 *
 * `scoop:apps:status` (`OutdatedApp[]` per API contract §4.2) is the canonical source
 * for outdated detection, but it is not currently exposed via the preload bridge
 * (`window.scoop`). Until `listStatus()` lands in preload, derive a deterministic
 * demo state from the installed list so the page can render the v2 outdated
 * visual treatment (warning row + badge). The mock is keyed by package name hash
 * so it survives refetches and produces stable fixtures.
 *
 * Swap-out: replace this function body with a second query against
 * `scoop:apps:status` and join by `name`.
 */
function enrichOutdated(pkg: AppInfo): InstalledPackage {
  const outdated = simulateOutdated(pkg);
  return outdated ? { ...pkg, outdated } : { ...pkg };
}

function simulateOutdated(pkg: AppInfo): OutdatedInfo | undefined {
  let h = 0;
  for (let i = 0; i < pkg.name.length; i += 1) {
    h = (h * 31 + pkg.name.charCodeAt(i)) >>> 0;
  }
  if (h % 3 !== 0) return undefined;
  const base = pkg.version || '0.0.0';
  const parts = base.split('.');
  const patch = Number(parts[parts.length - 1] ?? '0');
  const safePatch = Number.isFinite(patch) ? patch : 0;
  const bumped = parts.length > 1
    ? [...parts.slice(0, -1), String(safePatch + 1)].join('.')
    : `${base}.1`;
  return { latest: bumped, isOutdated: true };
}

export interface UseInstalledPackagesParams {
  locale: Locale;
}

export interface UseInstalledPackagesResult {
  packages: InstalledPackage[];
  isLoading: boolean;
  isError: boolean;
  error: InstalledPackagesError | null;
  refetch: () => void;
  outdatedCount: number;
  totalCount: number;
}

export function useInstalledPackages({ locale }: UseInstalledPackagesParams): UseInstalledPackagesResult {
  const query = useQuery<InstalledPackage[], Error>({
    queryKey: [INSTALLED_PACKAGES_QUERY_KEY],
    queryFn: fetchInstalledPackages,
    staleTime: 30_000,
  });

  const packages = query.data ?? [];
  const outdatedCount = packages.filter((p) => p.outdated?.isOutdated).length;

  let derivedError: InstalledPackagesError | null = null;
  if (query.error) {
    const e = query.error as unknown;
    if (e && typeof e === 'object' && 'code' in e && 'message' in e) {
      derivedError = {
        code: String((e as InstalledPackagesError).code),
        message: String((e as InstalledPackagesError).message),
      };
    } else {
      derivedError = { code: 'E_SCOOP_QUERY_FAILED', message: query.error.message };
    }
  }

  return {
    packages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: derivedError,
    refetch: () => {
      void query.refetch();
    },
    outdatedCount,
    totalCount: packages.length,
  };
}

// ─── Mutations ───────────────────────────────────────────────────────────

interface MutationCtx {
  qc: ReturnType<typeof useQueryClient>;
  locale: Locale;
}

function unwrapOk<T>(result: IPCResult<T>): T {
  if (!result.ok) {
    throw { code: result.error.code, message: result.error.message } satisfies InstalledPackagesError;
  }
  return result.data;
}

export interface UseUpdatePackageResult {
  mutate: (pkg: InstalledPackage) => void;
  isPending: boolean;
}

export function useUpdatePackage({ locale }: { locale: Locale }): UseUpdatePackageResult {
  const qc = useQueryClient();
  return useUpdateMutation({ qc, locale });
}

function useUpdateMutation({ qc, locale }: MutationCtx): UseUpdatePackageResult {
  const mutation = useMutation<unknown, InstalledPackagesError, InstalledPackage>({
    mutationFn: async (pkg) => {
      if (!window.scoop) throw { code: 'E_BRIDGE_UNAVAILABLE', message: 'scoop bridge unavailable' };
      const result = await window.scoop.updateApp({ name: pkg.name, global: false });
      return unwrapOk(result);
    },
    onSuccess: (_data, pkg) => {
      toast.success(lookup(locale, 'p04.mutation.updateSuccess', {
        name: pkg.name,
        version: pkg.outdated?.latest ?? pkg.version,
      }));
      void qc.invalidateQueries({ queryKey: [INSTALLED_PACKAGES_QUERY_KEY] });
    },
    onError: (err) => {
      toast.error(lookup(locale, 'p04.mutation.failure', { message: err.message }));
    },
  });

  return {
    mutate: (pkg) => mutation.mutate(pkg),
    isPending: mutation.isPending,
  };
}

export interface UseUninstallPackageResult {
  mutate: (pkg: InstalledPackage) => void;
  isPending: boolean;
}

export function useUninstallPackage({ locale }: { locale: Locale }): UseUninstallPackageResult {
  const qc = useQueryClient();
  const mutation = useMutation<unknown, InstalledPackagesError, InstalledPackage>({
    mutationFn: async (pkg) => {
      if (!window.scoop) throw { code: 'E_BRIDGE_UNAVAILABLE', message: 'scoop bridge unavailable' };
      const result = await window.scoop.uninstallApp({ name: pkg.name, global: false });
      return unwrapOk(result);
    },
    onSuccess: (_data, pkg) => {
      toast.success(lookup(locale, 'p04.mutation.uninstallSuccess', { name: pkg.name }));
      void qc.invalidateQueries({ queryKey: [INSTALLED_PACKAGES_QUERY_KEY] });
    },
    onError: (err) => {
      toast.error(lookup(locale, 'p04.mutation.failure', { message: err.message }));
    },
  });
  return {
    mutate: (pkg) => mutation.mutate(pkg),
    isPending: mutation.isPending,
  };
}

export interface UseBatchUpdateResult {
  mutate: (pkgs: InstalledPackage[]) => void;
  isPending: boolean;
}

/**
 * Batch update all outdated apps.
 *
 * Per API contract §4.2: `scoop:apps:update` with `name` omitted = `scoop update *`
 * (handled by main process serializing child jobs under MAX_PARALLEL_JOBS = 1).
 * A single invoke covers the entire batch.
 */
export function useBatchUpdate({ locale }: { locale: Locale }): UseBatchUpdateResult {
  const qc = useQueryClient();
  const mutation = useMutation<unknown, InstalledPackagesError, InstalledPackage[]>({
    mutationFn: async (pkgs) => {
      if (!window.scoop) throw { code: 'E_BRIDGE_UNAVAILABLE', message: 'scoop bridge unavailable' };
      const result = await window.scoop.updateApp({ global: false });
      return unwrapOk(result);
    },
    onSuccess: (_data, pkgs) => {
      toast.success(lookup(locale, 'p04.mutation.batchStart', { count: pkgs.length }));
      void qc.invalidateQueries({ queryKey: [INSTALLED_PACKAGES_QUERY_KEY] });
    },
    onError: (err) => {
      toast.error(lookup(locale, 'p04.mutation.batchFailure'));
      toast.error(lookup(locale, 'p04.mutation.failure', { message: err.message }));
    },
  });
  return {
    mutate: (pkgs) => mutation.mutate(pkgs),
    isPending: mutation.isPending,
  };
}