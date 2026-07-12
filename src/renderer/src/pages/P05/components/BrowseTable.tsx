/**
 * BrowseTable · 浏览全部可装/已装软件包(v2 prototype §8.6)
 * - 列:名称(已装 badge)| 版本 | 桶 | 更新时间 | 备注 | 操作
 * - 操作列:已装 → disabled "已装" 按钮;可装 → 主 CTA 安装(微光)
 * - 行点击 → 选中(高亮 + primary 边线),由父组件决定后续(P07 详情)
 */

import { useTranslation } from 'react-i18next';
import { Check, Download } from 'lucide-react';
import type { AppInfo } from '../../../../../shared/ipc-contract';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatVersion } from '@/lib/utils';

export interface BrowseTableProps {
  rows: AppInfo[];
  installedNames: Set<string>;
  loading?: boolean;
  selectedName?: string | null;
  onSelect?: (pkg: AppInfo) => void;
  onInstall?: (pkg: AppInfo) => void;
  installingName?: string | null;
}

export function BrowseTable({
  rows,
  installedNames,
  loading,
  selectedName,
  onSelect,
  onInstall,
  installingName,
}: BrowseTableProps) {
  const { t } = useTranslation('p05');

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '30%', minWidth: 200 }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '24%', minWidth: 160 }} />
          <col style={{ width: '12%', minWidth: 120 }} />
        </colgroup>
        <thead className="sticky top-0 z-10 border-b border-border bg-bg-elevated">
          <tr className="h-10">
            <th className="px-4 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
              {t('p05.col.name')}
            </th>
            <th className="px-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
              {t('p05.col.version')}
            </th>
            <th className="px-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
              {t('p05.col.bucket')}
            </th>
            <th className="px-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
              {t('p05.col.updated')}
            </th>
            <th className="px-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
              {t('p05.col.info')}
            </th>
            <th className="px-4 text-right text-xs font-medium uppercase tracking-wider text-fg-muted">
              {t('p05.col.action')}
            </th>
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 && <SkeletonRows />}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="h-32 text-center text-sm text-fg-muted">
                —
              </td>
            </tr>
          )}
          {rows.map((pkg) => {
            const installed = installedNames.has(pkg.name);
            const isSelected = selectedName === pkg.name;
            const isInstalling = installingName === pkg.name;
            return (
              <tr
                key={`${pkg.source}:${pkg.name}`}
                className={cn(
                  'group relative h-10 cursor-pointer border-b border-border transition-colors hover:bg-bg-overlay/60',
                  isSelected && 'bg-primary/10',
                )}
                onClick={() => onSelect?.(pkg)}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-full w-0.5 bg-primary shadow-[0_0_10px_var(--primary-glow)]"
                  />
                )}
                <td className="px-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        'truncate font-display font-medium',
                        isSelected ? 'text-primary' : 'text-fg',
                      )}
                    >
                      {pkg.name}
                    </span>
                    {installed && (
                      <Badge variant="success" className="gap-1">
                        <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                        {t('p05.status.installed')}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 font-mono text-xs text-fg-muted">
                  {formatVersion(pkg.version)}
                </td>
                <td className="px-3">
                  <Badge variant="secondary">{pkg.source || '—'}</Badge>
                </td>
                <td className="px-3 font-mono text-xs text-fg-muted">
                  {pkg.updated || '—'}
                </td>
                <td className="truncate px-3 text-xs text-fg-muted">{pkg.info || '—'}</td>
                <td className="px-4">
                  <div className="flex items-center justify-end">
                    {installed ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        className="w-[88px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Check className="h-3 w-3" strokeWidth={2.2} />
                        {t('p05.status.installed')}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-[88px] glow-primary"
                        disabled={isInstalling}
                        onClick={(e) => {
                          e.stopPropagation();
                          onInstall?.(pkg);
                        }}
                      >
                        <Download className="h-3 w-3" strokeWidth={2.4} />
                        {isInstalling ? '…' : t('p05.col.action')}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="h-10 border-b border-border">
          <td className="px-4 py-2">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-3 w-14" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-4 w-12" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-3 w-20" />
          </td>
          <td className="px-3 py-2">
            <Skeleton className="h-3 w-40" />
          </td>
          <td className="px-4 py-2">
            <Skeleton className="ml-auto h-7 w-[88px]" />
          </td>
        </tr>
      ))}
    </>
  );
}