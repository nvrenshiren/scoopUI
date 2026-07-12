import { MoreHorizontal, RefreshCw, Trash2, Info, Copy, Package } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn, formatVersion } from '@/lib/utils';
import { lookup, type Locale } from '../locales';
import type { InstalledPackage } from '../hooks/use-installed-packages';

interface PackageRowProps {
  locale: Locale;
  pkg: InstalledPackage;
  selected: boolean;
  onSelect: (name: string, next: boolean) => void;
  onActivate: (name: string) => void;
  onUpdate: (pkg: InstalledPackage) => void;
  onUninstall: (pkg: InstalledPackage) => void;
  updating: boolean;
  uninstalling: boolean;
}

export function PackageRow({
  locale,
  pkg,
  selected,
  onSelect,
  onActivate,
  onUpdate,
  onUninstall,
  updating,
  uninstalling,
}: PackageRowProps) {
  const outdated = pkg.outdated?.isOutdated === true;
  const latest = pkg.outdated?.latest;

  const onRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-row-control="true"]')) return;
    onActivate(pkg.name);
  };

  const onCheckboxChange = (checked: boolean | 'indeterminate') => {
    onSelect(pkg.name, Boolean(checked));
  };

  return (
    <tr
      role="row"
      data-state={selected ? 'selected' : undefined}
      data-outdated={outdated ? 'true' : undefined}
      onClick={onRowClick}
      className={cn(
        'group h-10 cursor-pointer border-b border-border align-middle transition-colors',
        'hover:bg-bg-overlay/60',
        selected && 'bg-primary/10',
        !selected && outdated && 'bg-warning/10',
        selected && outdated && 'bg-primary/10',
      )}
    >
      {/* Name + checkbox */}
      <td className="px-4 py-0" data-row-control="true">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onCheckboxChange}
            aria-label={lookup(locale, 'p04.table.col.checkbox')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            aria-hidden
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
              outdated
                ? 'border-warning/30 bg-warning/10 text-warning'
                : 'border-border bg-bg-overlay text-fg-muted',
            )}
          >
            <Package className="h-3.5 w-3.5" strokeWidth={1.6} />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-mono text-[13px] text-fg">{pkg.name}</span>
            {outdated && latest && (
              <span className="font-mono text-[10.5px] text-warning">
                → {latest}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Version */}
      <td className="px-3 py-0 font-mono text-[12.5px] text-fg">
        {formatVersion(pkg.version)}
      </td>

      {/* Source */}
      <td className="px-3 py-0 font-mono text-[12.5px] text-fg-muted">
        {pkg.source || '—'}
      </td>

      {/* Updated */}
      <td className="px-3 py-0 font-mono text-[11.5px] text-fg-muted">
        {pkg.updated || '—'}
      </td>

      {/* Status */}
      <td className="px-3 py-0">
        {outdated ? (
          <Badge
            variant="warning"
            className="gap-1 border-warning/40 font-medium"
            title={lookup(locale, 'p04.tooltip.outdated')}
          >
            <RefreshCw className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            {lookup(locale, 'p04.status.outdated')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="font-mono text-[11px]">
            {lookup(locale, 'p04.status.upToDate')}
          </Badge>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-0 text-right" data-row-control="true">
        <div className="flex items-center justify-end gap-1.5">
          {outdated && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(pkg);
              }}
              disabled={updating}
              className={cn(
                'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11.5px] font-medium transition-colors',
                'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              <RefreshCw
                className={cn('h-3 w-3', updating && 'animate-spin')}
                strokeWidth={2}
                aria-hidden
              />
              {lookup(locale, 'p04.row.action.update')}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={lookup(locale, 'p04.actions.more')}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-overlay hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                className="gap-2 text-[12.5px]"
                onSelect={() => onActivate(pkg.name)}
              >
                <Info className="h-3.5 w-3.5" aria-hidden />
                {lookup(locale, 'p04.row.action.details')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-[12.5px]"
                onSelect={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    void navigator.clipboard.writeText(pkg.name);
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                {lookup(locale, 'p04.row.action.copyName')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-[12.5px] text-destructive focus:bg-destructive/15 focus:text-destructive"
                onSelect={() => onUninstall(pkg)}
                disabled={uninstalling}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {lookup(locale, 'p04.row.action.uninstall')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}