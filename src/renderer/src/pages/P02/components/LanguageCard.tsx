import { Check, Languages } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { LanguageOption } from '../locales';

/**
 * 语言卡片(仅 zh-CN / en-US)
 * - 作为 RadioGroup 的一项:label 包裹 sr-only 的 RadioGroupItem,保证 a11y
 * - 选中态:v2 主色边框 + 三层光晕(ring 1px / glow 4px / 投影)
 */
interface LanguageCardProps {
  option: LanguageOption;
  selected: boolean;
}

const SELECTED_GLOW =
  '0 0 0 1px var(--primary), 0 0 0 4px var(--primary-glow), 0 10px 24px -8px var(--primary-glow)';

export function LanguageCard({ option, selected }: LanguageCardProps): React.JSX.Element {
  return (
    <label
      className={cn(
        'group relative flex h-56 w-72 cursor-pointer flex-col items-start overflow-hidden rounded-lg border p-6 text-left transition-all duration-200',
        selected
          ? 'border-primary bg-gradient-to-b from-primary/[0.06] to-bg-elevated'
          : 'border-border bg-bg-elevated shadow-md hover:-translate-y-px hover:border-border-strong hover:shadow-lg',
      )}
      style={selected ? { boxShadow: SELECTED_GLOW } : undefined}
    >
      <RadioGroupItem value={option.value} className="sr-only" />

      {/* 选中态顶部渐变条 */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 h-px transition-opacity duration-200',
          selected ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'linear-gradient(to right, transparent 0%, var(--primary) 50%, transparent 100%)',
        }}
      />

      {/* 对勾徽标 */}
      <span
        aria-hidden
        className={cn(
          'absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-bg transition-all duration-200 glow-primary',
          selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>

      {/* 语言名 */}
      <div className="mb-3.5 flex items-center gap-2">
        <Languages className="h-4 w-4 text-fg-muted" strokeWidth={1.6} />
        <span className="font-display text-xl font-semibold tracking-tight text-fg">
          {option.name}
        </span>
      </div>

      {/* 菜单预览 */}
      <ul className="flex-1 list-none space-y-0.5 p-0 text-sm leading-7 text-fg">
        {option.preview.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>

      {/* locale code */}
      <div className="mt-auto pt-3 font-mono text-[11px] tracking-wide text-fg-subtle">
        {option.code}
      </div>
    </label>
  );
}
