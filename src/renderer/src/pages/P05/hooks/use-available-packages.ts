/**
 * useAvailablePackages · 列出已添加桶内全部可装软件包,并交叉已装清单
 * - 调 window.scoop.listAvailable() + window.scoop.listInstalled() 并行
 * - 返回 { available, installed } 两个数组,UI 自行过滤
 */

import { useQuery } from '@tanstack/react-query';
import type { AppInfo } from '../../../../../shared/ipc-contract';

export interface AvailablePackagesData {
  available: AppInfo[];
  installed: AppInfo[];
}

async function fetchAvailablePackages(): Promise<AvailablePackagesData> {
  const [availableResult, installedResult] = await Promise.all([
    window.scoop.listAvailable(),
    window.scoop.listInstalled(),
  ]);

  if (!availableResult.ok) {
    throw new Error(availableResult.error.message);
  }

  return {
    available: availableResult.data,
    installed: installedResult.ok ? installedResult.data : [],
  };
}

export function useAvailablePackages() {
  return useQuery({
    queryKey: ['p05', 'available-packages'],
    queryFn: fetchAvailablePackages,
    staleTime: 30_000,
  });
}