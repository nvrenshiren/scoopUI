/**
 * usePackageSearch · 关键字搜索(debounce 300ms)
 * - 空查询返回 disabled,UI 自行决定是否调用列表接口
 * - 调 window.scoop.search(query)
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AppInfo } from '../../../../../shared/ipc-contract';

const SEARCH_DEBOUNCE_MS = 300;

async function searchPackages(query: string): Promise<AppInfo[]> {
  const result = await window.scoop.search(query);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export function usePackageSearch(rawQuery: string) {
  const trimmed = rawQuery.trim();
  const [debounced, setDebounced] = useState(trimmed);

  useEffect(() => {
    if (!trimmed) {
      setDebounced('');
      return;
    }
    const handle = window.setTimeout(() => setDebounced(trimmed), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [trimmed]);

  const enabled = debounced.length > 0;

  return useQuery({
    queryKey: ['p05', 'search', debounced],
    queryFn: () => searchPackages(debounced),
    enabled,
    staleTime: 30_000,
  });
}