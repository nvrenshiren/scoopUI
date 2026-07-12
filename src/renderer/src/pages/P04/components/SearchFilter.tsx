import { useMemo, useState, type ChangeEvent } from 'react';
import { Check, ChevronDown, Filter, Inbox, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { lookup, type Locale } from '../locales';
import type { InstalledPackage } from '../hooks/use-installed-packages';

export type StatusFilter = 'all' | 'outdated' | 'normal';
export type SortKey = 'name' | 'updated' | 'version';

export interface SearchFilterValue {
  query: string;
  status: StatusFilter;
  buckets: string[];
  sort: SortKey;
}

interface SearchFilterProps {
  locale: Locale;
  packages: InstalledPackage[];
  value: SearchFilterValue;
  onChange: (v: SearchFilterValue) => void;
  selectedCount: number;
  totalCount: number;
  outdatedCount: number;
}

export function SearchFilter({
  locale,
  packages,
  value,
  onChange,
  selectedCount,
  totalCount,
  outdatedCount,
}: SearchFilterProps) {
  const buckets = useMemo(() => {
    const set = new Set<string>();
    for (const p of packages) if (p.source) set.add(p.source);
    return Array.from(set).sort();
  }, [packages]);

  const onQueryChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, query: e.target.value });

  const setStatus = (status: StatusFilter) => onChange({ ...value, status });
  const toggleBucket = (bucket: string) => {
    const next = value.buckets.includes(bucket)
      ? value.buckets.filter((b) => b !== bucket)
      : [...value.buckets, bucket];
    onChange({ ...value, buckets: next });
  };
  const setSort = (sort: SortKey) => onChange({ ...value, sort });

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-bg-elevated px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative w-72 shrink-0">
          <Filter
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            strokeWidth={1.6}
            aria-hidden
            style={{ width: 14, height: 14 }}
          />
          <Input
            type="search"
            value={value.query}
            onChange={onQueryChange}
            placeholder={lookup(locale, 'p04.search.placeholder')}
            aria-label={lookup(locale, 'p04.search.ariaLabel')}
            className="h-8 pl-9 text-[13px]"
          />
        </div>

        <BucketMenu
          locale={locale}
          buckets={buckets}
          selected={value.buckets}
          onToggle={toggleBucket}
        />
        <SortMenu locale={locale} sort={value.sort} onSelect={setSort} />
      </div>

      <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-fg-muted">
        <span>
          {lookup(locale, 'p04.summary.totalShort', { total: totalCount })}
        </span>
        <span aria-hidden>·</span>
        <span className="text-fg">
          {lookup(locale, 'p04.footer.selected', { count: selectedCount })}
        </span>
        <StatusPill
          active={value.status === 'all'}
          label={`${lookup(locale, 'p04.filter.all')} ${totalCount}`}
          onClick={() => setStatus('all')}
        />
        <StatusPill
          active={value.status === 'outdated'}
          tone="warning"
          label={`${lookup(locale, 'p04.filter.outdated')} ${outdatedCount}`}
          onClick={() => setStatus('outdated')}
        />
        <StatusPill
          active={value.status === 'normal'}
          label={`${lookup(locale, 'p04.filter.normal')} ${totalCount - outdatedCount}`}
          onClick={() => setStatus('normal')}
        />
      </div>
    </div>
  );
}

function StatusPill({
  active,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  tone?: 'warning';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] transition-colors',
        active
          ? tone === 'warning'
            ? 'border-warning/40 bg-warning/15 text-warning'
            : 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-transparent text-fg-muted hover:border-border-strong hover:text-fg',
      )}
    >
      {label}
    </button>
  );
}

function BucketMenu({
  locale,
  buckets,
  selected,
  onToggle,
}: {
  locale: Locale;
  buckets: string[];
  selected: string[];
  onToggle: (b: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = lookup(locale, 'p04.filter.bucket');
  const suffix = selected.length > 0 ? ` · ${selected.length}` : '';
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-[12px]"
        >
          <Layers className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
          <span>{label}{suffix}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {buckets.length === 0 && (
          <div className="px-2 py-1.5 text-[12px] text-fg-subtle">
            <Inbox className="mr-1 inline h-3 w-3" aria-hidden />
            —
          </div>
        )}
        {buckets.map((b) => {
          const checked = selected.includes(b);
          return (
            <DropdownMenuCheckboxItem
              key={b}
              checked={checked}
              onCheckedChange={() => onToggle(b)}
            >
              <span className="font-mono text-[12px]">{b}</span>
              {checked && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
            </DropdownMenuCheckboxItem>
          );
        })}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => selected.forEach((b) => onToggle(b))}
              className="text-[12px] text-fg-muted"
            >
              {lookup(locale, 'p04.actions.cancel')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortMenu({
  locale,
  sort,
  onSelect,
}: {
  locale: Locale;
  sort: SortKey;
  onSelect: (s: SortKey) => void;
}) {
  const label = lookup(locale, 'p04.filter.sort');
  const items: Array<{ key: SortKey; label: string }> = [
    { key: 'name', label: lookup(locale, 'p04.filter.sortName') },
    { key: 'updated', label: lookup(locale, 'p04.filter.sortUpdated') },
    { key: 'version', label: lookup(locale, 'p04.filter.sortVersion') },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-[12px]"
        >
          <span>{label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((it) => (
          <DropdownMenuItem
            key={it.key}
            onSelect={() => onSelect(it.key)}
            className="flex items-center gap-2 text-[12px]"
          >
            <span className="flex-1">{it.label}</span>
            {sort === it.key && <Check className="h-3.5 w-3.5 text-primary" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}