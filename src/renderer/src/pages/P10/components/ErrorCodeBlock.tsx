import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface ErrorCodeBlockProps {
  code: string;
  label: string;
  detail?: string;
  className?: string;
}

export function ErrorCodeBlock({ code, label, detail, className }: ErrorCodeBlockProps) {
  return (
    <Alert variant="destructive" className={cn('text-left', className)}>
      <AlertCircle className="text-destructive" />
      <AlertTitle className="text-xs text-fg-muted">{label}</AlertTitle>
      <AlertDescription className="space-y-1">
        <code className="block rounded-sm border border-destructive/25 bg-bg px-2 py-1.5 font-mono text-[11.5px] text-destructive">
          {code}
        </code>
        {detail && <span className="block text-xs text-fg-muted">{detail}</span>}
      </AlertDescription>
    </Alert>
  );
}
