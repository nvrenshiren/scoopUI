import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { JobLogLine } from '../hooks/use-job-progress';
import type { P08Copy } from '../locales';

interface LogStreamProps {
  logs: JobLogLine[];
  copy: P08Copy;
  className?: string;
}

const logClassName: Record<JobLogLine['level'], string> = {
  info: 'text-fg-muted',
  success: 'text-primary',
  error: 'text-destructive',
  muted: 'text-fg-subtle',
};

export function LogStream({ logs, copy, className }: LogStreamProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [logs]);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-fg-subtle">{copy.labels.rawLog}</span>
        <span className="font-mono text-[10px] text-fg-subtle">tail -f scoop.log</span>
      </div>
      <div
        ref={ref}
        className="h-64 overflow-y-auto rounded-md border border-border bg-bg/50 px-4 py-3 font-mono text-xs leading-relaxed"
      >
        {logs.length ? (
          logs.map((line) => (
            <div key={line.id} className={cn('whitespace-pre-wrap break-all py-px', logClassName[line.level])}>
              {line.text}
            </div>
          ))
        ) : (
          <div className="text-fg-subtle">{copy.labels.noLog}</div>
        )}
      </div>
    </div>
  );
}
