import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { P01Copy } from '../locales';

type EmptyStateVariant = 'ready' | 'waiting' | 'error';

interface EmptyStateProps {
  copy: P01Copy;
  variant: EmptyStateVariant;
  onAction?: () => void;
}

export function EmptyState({ copy, variant, onAction }: EmptyStateProps) {
  const isReady = variant === 'ready';
  const isWaiting = variant === 'waiting';
  const Icon = isReady ? CheckCircle2 : isWaiting ? Clock3 : AlertCircle;
  const title = isReady
    ? copy.emptyState.readyTitle
    : isWaiting
      ? copy.emptyState.waitingTitle
      : copy.emptyState.errorTitle;
  const desc = isReady
    ? copy.emptyState.readyDesc
    : isWaiting
      ? copy.emptyState.waitingDesc
      : copy.emptyState.errorDesc;
  const action = isReady
    ? copy.emptyState.readyAction
    : isWaiting
      ? copy.emptyState.waitingAction
      : copy.emptyState.errorAction;

  return (
    <Card className="border-border bg-bg-elevated">
      <div className="card-top-line" />
      <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary glow-primary">
          <Icon className="h-7 w-7" strokeWidth={2.2} />
        </div>
        <div className="max-w-lg space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-display text-xl font-semibold text-fg">{title}</h3>
            <Badge variant={isReady ? 'success' : 'secondary'}>{isReady ? copy.common.pass : copy.common.pending}</Badge>
          </div>
          <p className="text-sm leading-relaxed text-fg-muted">{desc}</p>
        </div>
        <Button variant={isReady ? 'default' : 'secondary'} disabled={isWaiting} onClick={onAction}>
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}
