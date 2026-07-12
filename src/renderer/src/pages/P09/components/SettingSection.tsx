/**
 * P09 设置分区壳
 * - 复用项目 v2 Card 顶部 thin gradient line(glow 微光)
 * - title + 可选 channel tag + 子内容
 */
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SettingSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  channel?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function SettingSection({
  title,
  description,
  channel,
  right,
  children,
  className,
}: SettingSectionProps) {
  return (
    <Card className={cn('p-6', className)}>
      <span className="card-top-line" aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-semibold tracking-tight text-fg">{title}</div>
          {description && <div className="mt-1 text-sm text-fg-muted">{description}</div>}
        </div>
        {(channel || right) && (
          <div className="flex shrink-0 items-center gap-2">
            {channel && (
              <span className="font-mono text-xs text-fg-subtle">{channel}</span>
            )}
            {right}
          </div>
        )}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </Card>
  );
}
