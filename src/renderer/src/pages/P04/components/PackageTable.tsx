import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PackageRow } from './PackageRow';
import { lookup, type Locale } from '../locales';
import type { InstalledPackage } from '../hooks/use-installed-packages';
import type { SearchFilterValue, SortKey } from './SearchFilter';

interface PackageTableProps {
  locale: Locale;
  packages: InstalledPackage[];
  filter: SearchFilterValue;
  selectedNames: Set<string>;
  onToggleSelect: (name: string, next: boolean) => void;
  onToggleSelectAll: (next: boolean) => void;
  onActivate: (name: string) => void;
  onUpdate: (pkg: InstalledPackage) => void;
  onUninstall: (pkg: InstalledPackage) => void;
  updatingNames: Set<string>;
  uninstallingNames: Set<string>;
  loading: boolean;
}

export function PackageTable({
  locale,
  packages,
  filter,
  selectedNames,
  onToggleSelect,
  onToggleSelectAll,
  onActivate,
  onUpdate,
  onUninstall,
  updatingNames,
  uninstallingNames,
  loading,
}: PackageTableProps) {
  const filtered = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    const list = packages.filter((p) => {
      if (filter.status === 'outdated' && !p.outdated?.isOutdated) return false;
      if (filter.status === 'normal' && p.outdated?.isOutdated) return false;
      if (filter.buckets.length > 0 && !filter.buckets.includes(p.source)) return false;
      if (q) {
        const hay = `${p.name} ${p.source} ${p.version}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return sortPackages(list, filter.sort);
  }, [packages, filter]);

  const allChecked = filtered.length > 0 && filtered.every((p) => selectedNames.has(p.name));
  const someChecked = !allChecked && filtered.some((p) => selectedNames.has(p.name));

  return (
    <div className="relative flex-1 overflow-auto">
      <Table className="w-full table-fixed text-sm">
        <colgroup>
          <col style={{ width: '32%', minWidth: 220 }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '20%', minWidth: 200 }} />
        </colgroup>
        <TableHeader className="sticky top-0 z-10 border-b border-border bg-bg-elevated">
          <TableRow className="h-10 hover:bg-transparent">
            <TableHead className="px-4 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                  onCheckedChange={(v) => onToggleSelectAll(Boolean(v))}
                  aria-label={lookup(locale, 'p04.table.col.checkboxAll')}
                  disabled={filtered.length === 0}
                />
                <span>{lookup(locale, 'p04.table.col.name')}</span>
              </div>
            </TableHead>
            <TableHead className="px-3 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {lookup(locale, 'p04.table.col.version')}
            </TableHead>
            <TableHead className="px-3 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {lookup(locale, 'p04.table.col.source')}
            </TableHead>
            <TableHead className="px-3 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {lookup(locale, 'p04.table.col.updated')}
            </TableHead>
            <TableHead className="px-3 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {lookup(locale, 'p04.table.col.status')}
            </TableHead>
            <TableHead className="px-4 text-right text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {lookup(locale, 'p04.table.col.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-[12.5px] text-fg-subtle">
                {lookup(locale, 'p04.summary.totalShort', { total: 0 })}
              </td>
            </tr>
          )}
          {filtered.map((pkg) => (
            <PackageRow
              key={pkg.name}
              locale={locale}
              pkg={pkg}
              selected={selectedNames.has(pkg.name)}
              onSelect={onToggleSelect}
              onActivate={onActivate}
              onUpdate={onUpdate}
              onUninstall={onUninstall}
              updating={updatingNames.has(pkg.name)}
              uninstalling={uninstallingNames.has(pkg.name)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function sortPackages(list: InstalledPackage[], sort: SortKey): InstalledPackage[] {
  const arr = [...list];
  arr.sort((a, b) => {
    switch (sort) {
      case 'updated':
        return (b.updated ?? '').localeCompare(a.updated ?? '');
      case 'version':
        return (a.version ?? '').localeCompare(b.version ?? '', undefined, { numeric: true });
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });
  return arr;
}