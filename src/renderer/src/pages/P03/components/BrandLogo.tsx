import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { translate, type Locale } from '../locales';

interface BrandLogoProps {
  version?: string;
  ready?: boolean;
  className?: string;
}

/**
 * Sidebar 顶部品牌标
 * v2 token:`bg-bg-elevated` 容器 + `linear-gradient(135deg, primary, primary-hover)` logo 方块
 * + inset top highlight + `glow-primary` 微光
 */
export function BrandLogo({ version = '0.5.2', ready = true, className }: BrandLogoProps) {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN';
  const subtitle = translate('p03.brand.subtitle', locale, { version });
  const title = translate('p03.brand.title', locale);

  return (
    <div className={cn('flex h-[72px] items-center gap-3 px-4', className)}>
      <div
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-md text-black glow-primary"
        style={{
          background: 'linear-gradient(135deg, var(--primary), #16A34A)',
          boxShadow:
            '0 0 16px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <Package className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold leading-tight text-fg">
          {title}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] leading-tight text-fg-muted">
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full',
              ready ? 'bg-primary' : 'bg-fg-subtle',
            )}
            style={
              ready
                ? { boxShadow: '0 0 6px var(--primary)' }
                : undefined
            }
          />
          <span>{subtitle}</span>
        </div>
      </div>
    </div>
  );
}