import { Check, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { P01Copy } from '../locales';
import type { ScoopDetectData } from '../hooks/use-scoop-detect';

interface ConfigChecklistProps {
  copy: P01Copy;
  data?: ScoopDetectData;
  isLoading: boolean;
  error: Error | null;
}

type CheckState = 'pass' | 'fail' | 'pending' | 'checking';

interface ChecklistRow {
  id: string;
  label: string;
  command: string;
  detail: string;
  state: CheckState;
}

function statusText(copy: P01Copy, state: CheckState): string {
  if (state === 'pass') return copy.checklist.states.passed;
  if (state === 'fail') return copy.checklist.states.failed;
  if (state === 'checking') return copy.checklist.states.checking;
  return copy.checklist.states.pending;
}

function renderMark(state: CheckState) {
  if (state === 'pass') return <Check className="h-4 w-4" strokeWidth={2.5} />;
  if (state === 'fail') return <X className="h-4 w-4" strokeWidth={2.5} />;
  return <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />;
}

export function ConfigChecklist({ copy, data, isLoading, error }: ConfigChecklistProps) {
  const available = data?.available === true;
  const baseState: CheckState = isLoading ? 'checking' : available ? 'pass' : 'fail';
  const softState: CheckState = isLoading ? 'checking' : available ? 'pass' : 'pending';
  const items = copy.checklist.items;
  const rows: ChecklistRow[] = [
    {
      id: 'scoopCommand',
      label: items.scoopCommand.label,
      command: items.scoopCommand.command,
      detail: data?.path ?? error?.message ?? copy.checklist.noPath,
      state: baseState,
    },
    {
      id: 'scoopCore',
      label: items.scoopCore.label,
      command: items.scoopCore.command,
      detail: data?.version ?? copy.checklist.noVersion,
      state: baseState,
    },
    {
      id: 'envVars',
      label: items.envVars.label,
      command: items.envVars.command,
      detail: available ? copy.common.pass : copy.common.pending,
      state: softState,
    },
    {
      id: 'powershell',
      label: items.powershell.label,
      command: items.powershell.command,
      detail: isLoading ? copy.common.checking : available ? copy.common.pass : copy.common.pending,
      state: softState,
    },
    {
      id: 'path',
      label: items.path.label,
      command: items.path.command,
      detail: data?.path ?? copy.checklist.noPath,
      state: isLoading ? 'checking' : data?.path ? 'pass' : 'fail',
    },
  ];

  return (
    <Card className="border-border bg-bg-elevated">
      <div className="card-top-line" />
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base">{copy.checklist.title}</CardTitle>
        <CardDescription>{copy.checklist.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-border bg-bg p-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm',
                  row.state === 'pass'
                    ? 'border-primary/40 bg-primary/10 text-primary glow-primary'
                    : row.state === 'fail'
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-border bg-bg-overlay text-fg-muted',
                )}
                aria-label={statusText(copy, row.state)}
              >
                {renderMark(row.state)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-fg">{row.label}</span>
                  <Badge
                    variant={row.state === 'pass' ? 'success' : row.state === 'fail' ? 'destructive' : 'secondary'}
                    className="shrink-0"
                  >
                    {row.state === 'pass' ? '✓' : row.state === 'fail' ? '✗' : '…'} {statusText(copy, row.state)}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
                  <span className="text-fg-subtle">{row.command}</span>
                  <span className="truncate text-fg-muted">{row.detail}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
