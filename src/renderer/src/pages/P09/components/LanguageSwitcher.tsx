/**
 * P09 语言切换 RadioGroup
 * - 选项 zh-CN / en-US,与 `UILanguage` 枚举对齐
 * - 选中即写入 prefs(IPC scoop:prefs:set),失败回退提示由 use-settings 接管
 */
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UILanguage } from '../../../../../shared/enums';
import { cn } from '@/lib/utils';

export interface LanguageSwitcherProps {
  value: UILanguage;
  onChange: (lang: UILanguage) => void;
  disabled?: boolean;
}

interface LangOption {
  value: UILanguage;
  labelKey: string;
  descKey: string;
  codeKey: string;
}

const OPTIONS: LangOption[] = [
  {
    value: UILanguage.zhCN,
    labelKey: 'p09.section.language.option.zh.label',
    descKey: 'p09.section.language.option.zh.desc',
    codeKey: 'p09.section.language.code.zh',
  },
  {
    value: UILanguage.enUS,
    labelKey: 'p09.section.language.option.en.label',
    descKey: 'p09.section.language.option.en.desc',
    codeKey: 'p09.section.language.code.en',
  },
];

export function LanguageSwitcher({ value, onChange, disabled }: LanguageSwitcherProps) {
  const { t } = useTranslation('p09');
  const current = OPTIONS.find((o) => o.value === value) ?? {
    value: UILanguage.zhCN,
    labelKey: 'p09.section.language.option.zh.label',
    descKey: 'p09.section.language.option.zh.desc',
    codeKey: 'p09.section.language.code.zh',
  };

  return (
    <>
      <div className="status-strip flex items-center gap-4 rounded-md border border-border bg-bg-overlay/70 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary glow-primary">
          <Globe className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-fg">{t('p09.section.language.current')}</div>
          <div className="mt-1 text-xs text-fg-muted">
            {t('p09.section.language.current.desc')}
          </div>
        </div>
        <span className="pill inline-flex h-6 items-center gap-1.5 rounded-full border border-primary/55 bg-primary/10 px-2.5 text-xs font-bold text-primary">
          <span>{current.labelKey ? t(current.labelKey) : ''}</span>
          <span className="font-mono text-fg-muted">{t(current.codeKey)}</span>
        </span>
      </div>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as UILanguage)}
        disabled={disabled}
        aria-label={t('p09.section.language') ?? undefined}
        className="mt-5 grid grid-cols-1 gap-3"
      >
        {OPTIONS.map((opt) => {
          const selected = opt.value === value;
          return (
            <label
              key={opt.value}
              htmlFor={`lang-${opt.value}`}
              className={cn(
                'group flex min-h-[64px] cursor-pointer items-center gap-3.5 rounded-md border bg-bg-elevated/80 px-4 py-3 text-fg transition-all',
                'hover:border-border-strong hover:bg-bg-overlay',
                selected &&
                  'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_20px_rgba(34,197,94,0.18)]',
              )}
            >
              <RadioGroupItem id={`lang-${opt.value}`} value={opt.value} />
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-bold">{t(opt.labelKey)}</span>
                <span className="mt-1 block text-xs text-fg-muted">{t(opt.descKey)}</span>
              </span>
              {selected && (
                <span className="text-primary" aria-hidden>
                  <Check className="h-4 w-4" />
                </span>
              )}
            </label>
          );
        })}
      </RadioGroup>
    </>
  );
}
