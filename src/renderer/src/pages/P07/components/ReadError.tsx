import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pickLocale, type Lang } from '../locales';

export interface ReadErrorProps {
  name: string;
  lang: Lang;
  errorCode?: string;
  errorMessage?: string;
  onRetry: () => void;
  onClose: () => void;
  retrying?: boolean;
}

export function ReadError({
  name,
  lang,
  errorCode,
  errorMessage,
  onRetry,
  onClose,
  retrying,
}: ReadErrorProps) {
  const t = pickLocale(lang);

  return (
    <div className="px-6 py-5">
      <div
        className="mb-5 flex flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 p-5 text-center"
        role="alert"
      >
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="h-[18px] w-[18px]" aria-hidden strokeWidth={2} />
        </div>
        <h3 className="font-display text-sm font-semibold text-fg">{t.readFailedTitle}</h3>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-fg-muted">
          {t.readFailedBody}
        </p>
        {(errorCode || errorMessage) && (
          <div className="mt-3 flex items-center gap-2">
            {errorCode ? (
              <span className="rounded-sm border border-destructive bg-destructive/10 px-2 py-0.5 font-mono text-[11px] text-destructive">
                {errorCode}
              </span>
            ) : null}
            {errorMessage ? (
              <span className="font-mono text-[11px] text-fg-subtle">{errorMessage}</span>
            ) : null}
          </div>
        )}
      </div>

      <div
        className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/15 p-2.5 text-[12.5px] leading-relaxed text-warning"
        role="note"
      >
        <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden />
        <div className="font-mono text-[12px] leading-relaxed">
          <span className="text-fg">$ scoop info {name}</span>
          <br />
          <span className="text-destructive">ERROR</span>{' '}
          <span className="text-fg-muted">
            {errorMessage ?? 'scoop info parse failed.'}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-xs text-fg-muted">
          {t.suggestion}: {t.retryOrInspect}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" size="default" onClick={onClose}>
            {t.close}
          </Button>
          <Button type="button" variant="outline" size="default" onClick={() => undefined}>
            {t.viewManifest}
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            className="glow-primary"
            disabled={retrying}
            onClick={onRetry}
          >
            <RefreshIcon spin={retrying} />
            {retrying ? t.retrying : t.retry}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spin ? 'animate-spin' : undefined}
      aria-hidden
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}