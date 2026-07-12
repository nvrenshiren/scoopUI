import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import type { UILanguage } from '../../../../shared/enums';
import { HeroSection } from './components/HeroSection';
import { LanguageCard } from './components/LanguageCard';
import { useLanguage } from './hooks/use-language';
import { LANGUAGE_OPTIONS, resolvePageCopy } from './locales';

/**
 * P02 · 语言选择页(首次启动 · F13)
 * - 仅 zh-CN / en-US(PRD §4);未选择不可继续(PRD §5)
 * - 确认后立即生效 + 持久化;保存失败以 Sonner 告知即时生效/下次可能回退(F19)
 */
interface P02Props {
  /** 语言确认并处理完成后的回调(进入检测 Scoop 阶段) */
  onComplete?: (lang: UILanguage) => void;
}

export function P02({ onComplete }: P02Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const { applyNow, persist, isSaving } = useLanguage();
  const [selected, setSelected] = useState<UILanguage | null>(null);

  const copy = resolvePageCopy(i18n.language);

  const handleSelect = (value: string): void => {
    const lang = value as UILanguage;
    setSelected(lang);
    applyNow(lang);
  };

  const handleContinue = async (): Promise<void> => {
    if (!selected) return;
    const saved = await persist(selected);
    if (!saved) {
      toast.warning(copy.toast.title, {
        description: copy.toast.desc,
      });
    }
    onComplete?.(selected);
  };

  return (
    <div className="bg-grid bg-glow-top flex h-full w-full items-center justify-center px-8">
      <div className="flex w-[640px] max-w-full flex-col items-center">
        <HeroSection copy={copy} />

        {/* 语言卡片组 */}
        <RadioGroup
          value={selected ?? undefined}
          onValueChange={handleSelect}
          aria-label={copy.title}
          className="mt-10 grid grid-flow-col gap-6"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <LanguageCard
              key={option.value}
              option={option}
              selected={selected === option.value}
            />
          ))}
        </RadioGroup>

        {/* 主 CTA */}
        <div className="mt-10">
          <Button
            size="lg"
            disabled={!selected || isSaving}
            title={!selected ? copy.selectHint : undefined}
            onClick={() => void handleContinue()}
            className="h-12 gap-2 px-8 text-base font-bold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.saving}
              </>
            ) : (
              <>
                {copy.continue}
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </>
            )}
          </Button>
        </div>

        {/* 底部说明 */}
        <p className="mt-5 text-xs leading-relaxed text-fg-subtle">{copy.footer}</p>
      </div>
    </div>
  );
}

export default P02;
