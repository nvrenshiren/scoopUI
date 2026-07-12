/**
 * SearchBar · cmdk 搜索框(v2 token)
 * - 聚焦:primary 边线 + 4px primary-glow 外环(tech glow)
 * - 快捷键:⌘K / Ctrl K 聚焦,Esc 清空
 * - 内置清除按钮(查询非空时显示)
 */

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Command, CommandInput } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.platform || '';
  return /Mac|iPhone|iPad|iPod/i.test(ua);
}

export function SearchBar({ value, onChange, onClear, placeholder, className }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const { t } = useTranslation('p05');
  const mac = isMacPlatform();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (value) {
          e.preventDefault();
          onClear();
        }
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClear, value]);

  return (
    <Command
      shouldFilter={false}
      className={cn(
        'flex h-9 w-full items-center rounded-md border border-border bg-bg-overlay px-3',
        'transition-all',
        focused &&
          'border-primary shadow-[0_0_0_4px_var(--primary-glow)]',
        className,
      )}
    >
      <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-fg-muted" />
      <CommandInput
        ref={inputRef}
        value={value}
        onValueChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? t('p05.search.placeholder')}
        className="h-9 flex-1 border-0 bg-transparent px-0 text-sm text-fg placeholder:text-fg-subtle focus:ring-0 focus:ring-offset-0"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          aria-label={t('p05.search.clear')}
          className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <kbd className="ml-1 hidden h-5 shrink-0 select-none items-center justify-center rounded-sm border border-border bg-bg/40 px-1.5 font-mono text-[11px] text-fg-muted sm:inline-flex">
        {mac ? t('p05.search.kbd.mac') : t('p05.search.kbd.other')}
      </kbd>
    </Command>
  );
}