import type { PageCopy } from '../locales';

/**
 * 顶部品牌区 + 引导标题(P02 首屏)
 */
interface HeroSectionProps {
  copy: PageCopy;
}

export function HeroSection({ copy }: HeroSectionProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      {/* 品牌标识 */}
      <div className="mb-6 flex items-center gap-2 font-display text-[13px] font-medium tracking-wide text-fg-muted">
        <span className="h-2 w-2 rounded-full bg-primary glow-primary" />
        <span>{copy.brand}</span>
      </div>

      {/* Stepper */}
      <div className="mb-4 font-mono text-xs uppercase tracking-[0.08em] text-fg-subtle">
        {copy.step}
      </div>

      {/* 主标题 */}
      <h1 className="font-display text-[40px] font-bold leading-[1.15] tracking-tight text-fg">
        {copy.title}
      </h1>

      {/* 副标 */}
      <p className="mt-3 max-w-[480px] text-[15px] leading-relaxed text-fg-muted">
        {copy.subtitle}
      </p>
    </div>
  );
}
