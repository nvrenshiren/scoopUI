import type { ReactNode } from 'react';
import type { InstallJobState } from '../../../../../shared/ipc-contract';
import { cn } from '@/lib/utils';

export type ProgressTone = 'running' | 'success' | 'failed' | 'cancelled';

export const toneClassNames: Record<ProgressTone, {
  text: string;
  badge: string;
  panel: string;
  border: string;
  icon: string;
  progress: string;
}> = {
  running: {
    text: 'text-primary',
    badge: 'border-primary/30 bg-primary/10 text-primary',
    panel: 'border-primary/25 bg-primary/10',
    border: 'border-primary/30',
    icon: 'bg-primary/15 text-primary',
    progress: '[&>div]:bg-primary',
  },
  success: {
    text: 'text-primary',
    badge: 'border-primary/30 bg-primary/10 text-primary',
    panel: 'border-primary/25 bg-primary/10',
    border: 'border-primary/30',
    icon: 'bg-primary/15 text-primary',
    progress: '[&>div]:bg-primary',
  },
  failed: {
    text: 'text-destructive',
    badge: 'border-destructive/30 bg-destructive/10 text-destructive',
    panel: 'border-destructive/30 bg-destructive/10',
    border: 'border-destructive/30',
    icon: 'bg-destructive/15 text-destructive',
    progress: '[&>div]:bg-destructive',
  },
  cancelled: {
    text: 'text-fg-muted',
    badge: 'border-fg-muted/30 bg-fg-muted/10 text-fg-muted',
    panel: 'border-fg-muted/30 bg-fg-muted/10',
    border: 'border-fg-muted/30',
    icon: 'bg-fg-muted/15 text-fg-muted',
    progress: '[&>div]:bg-fg-muted',
  },
};

export function getStateTone(state: InstallJobState): ProgressTone {
  if (state === 'succeeded') return 'success';
  if (state === 'failed') return 'failed';
  if (state === 'cancelled') return 'cancelled';
  return 'running';
}

interface ColorVariantProps {
  state: InstallJobState;
  className?: string;
  children: ReactNode;
}

export function ColorVariant({ state, className, children }: ColorVariantProps) {
  const tone = getStateTone(state);
  return <span className={cn(toneClassNames[tone].text, className)}>{children}</span>;
}
