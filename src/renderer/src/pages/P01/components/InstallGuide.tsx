import { useMemo, useState, type ChangeEvent } from 'react';
import { FileWarning, Network, ShieldAlert, TerminalSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { P01Copy } from '../locales';

interface InstallGuideProps {
  copy: P01Copy;
  onConfirmInstall?: (config: InstallConfigState) => void;
}

export interface InstallConfigState {
  scoopDir: string;
  scoopGlobalDir: string;
  scoopCacheDir: string;
  noProxy: boolean;
  proxy: string;
  proxyCredential: {
    username: string;
    password: string;
  };
  proxyUseDefaultCredentials: boolean;
  runAsAdmin: boolean;
}

const defaultConfig: InstallConfigState = {
  scoopDir: '~/scoop',
  scoopGlobalDir: '',
  scoopCacheDir: '~/scoop/cache',
  noProxy: false,
  proxy: '',
  proxyCredential: {
    username: '',
    password: '',
  },
  proxyUseDefaultCredentials: false,
  runAsAdmin: false,
};

function hasInvalidPath(value: string): boolean {
  return /[<>"|?*]/.test(value);
}

function FieldLabel({ label, keyName, required }: { label: string; keyName: string; required?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-fg">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      <Badge variant="secondary" className="font-mono text-[11px]">{keyName}</Badge>
    </div>
  );
}

function TextField({
  label,
  keyName,
  hint,
  value,
  placeholder,
  required,
  invalid,
  type = 'text',
  onChange,
}: {
  label: string;
  keyName: string;
  hint?: string;
  value: string;
  placeholder: string;
  required?: boolean;
  invalid?: boolean;
  type?: 'text' | 'password';
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} keyName={keyName} required={required} />
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className={cn('font-mono text-xs', invalid && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive')}
      />
      {hint ? <span className="text-xs leading-relaxed text-fg-muted">{hint}</span> : null}
    </label>
  );
}

function ToggleRow({
  label,
  keyName,
  hint,
  checked,
  warning,
  onCheckedChange,
}: {
  label: string;
  keyName: string;
  hint: string;
  checked: boolean;
  warning?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border bg-bg-overlay p-4',
        warning ? 'border-warning/40 bg-warning/10' : 'border-border',
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-sm font-medium', warning ? 'text-warning' : 'text-fg')}>{label}</span>
          <Badge variant="secondary" className="font-mono text-[11px]">{keyName}</Badge>
        </div>
        <p className="text-xs leading-relaxed text-fg-muted">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function InstallGuide({ copy, onConfirmInstall }: InstallGuideProps) {
  const [config, setConfig] = useState<InstallConfigState>(defaultConfig);
  const field = copy.installGuide.fields;
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    const paths = [config.scoopDir, config.scoopGlobalDir, config.scoopCacheDir].filter(Boolean);
    const credentialUsername = config.proxyCredential.username.trim();
    const credentialPassword = config.proxyCredential.password.trim();

    if (!config.scoopDir.trim()) issues.push(copy.installGuide.validation.scoopDirRequired);
    if (paths.some(hasInvalidPath)) issues.push(copy.installGuide.validation.invalidPath);
    if (config.noProxy && config.proxy.trim()) issues.push(copy.installGuide.validation.noProxyConflict);
    if ((credentialUsername && !credentialPassword) || (!credentialUsername && credentialPassword)) {
      issues.push(copy.installGuide.validation.proxyCredentialIncomplete);
    }
    if (config.proxyUseDefaultCredentials && (credentialUsername || credentialPassword)) {
      issues.push(copy.installGuide.validation.defaultCredentialConflict);
    }

    return issues;
  }, [config, copy]);
  const needsAdmin = Boolean(config.scoopGlobalDir.trim() || config.runAsAdmin);
  const canConfirm = validationIssues.length === 0;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-bg-elevated">
        <div className="card-top-line" />
        <CardHeader className="p-6 pb-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <TerminalSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">{copy.installGuide.title}</CardTitle>
              <CardDescription className="mt-1 leading-relaxed">{copy.installGuide.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-bg p-4">
            <h3 className="font-display text-sm font-semibold text-fg">{copy.installGuide.introTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{copy.installGuide.introDesc}</p>
          </div>
          <div className="rounded-lg border border-border bg-bg p-4">
            <h3 className="font-display text-sm font-semibold text-fg">{copy.installGuide.requirementsTitle}</h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-fg-muted">
              {copy.installGuide.requirements.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary glow-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-bg-elevated">
        <div className="card-top-line" />
        <CardHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{copy.installGuide.fieldsTitle}</CardTitle>
              <CardDescription className="mt-1 leading-relaxed">{copy.installGuide.fieldsSubtitle}</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">8 / 8</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 pt-0">
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2 font-display text-sm font-semibold uppercase tracking-wider text-fg-muted">
              <FileWarning className="h-4 w-4 text-primary" />
              {copy.installGuide.pathsSection}
            </div>
            <TextField
              label={field.scoopDir.label}
              keyName={field.scoopDir.key}
              hint={field.scoopDir.hint}
              value={config.scoopDir}
              placeholder={field.scoopDir.placeholder}
              required
              invalid={!config.scoopDir.trim() || hasInvalidPath(config.scoopDir)}
              onChange={(value) => setConfig((current) => ({ ...current, scoopDir: value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={field.scoopGlobalDir.label}
                keyName={field.scoopGlobalDir.key}
                hint={field.scoopGlobalDir.hint}
                value={config.scoopGlobalDir}
                placeholder={field.scoopGlobalDir.placeholder}
                invalid={hasInvalidPath(config.scoopGlobalDir)}
                onChange={(value) => setConfig((current) => ({ ...current, scoopGlobalDir: value }))}
              />
              <TextField
                label={field.scoopCacheDir.label}
                keyName={field.scoopCacheDir.key}
                hint={field.scoopCacheDir.hint}
                value={config.scoopCacheDir}
                placeholder={field.scoopCacheDir.placeholder}
                invalid={hasInvalidPath(config.scoopCacheDir)}
                onChange={(value) => setConfig((current) => ({ ...current, scoopCacheDir: value }))}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2 font-display text-sm font-semibold uppercase tracking-wider text-fg-muted">
              <Network className="h-4 w-4 text-primary" />
              {copy.installGuide.proxySection}
            </div>
            <ToggleRow
              label={field.noProxy.label}
              keyName={field.noProxy.key}
              hint={field.noProxy.hint}
              checked={config.noProxy}
              onCheckedChange={(checked) => setConfig((current) => ({ ...current, noProxy: checked }))}
            />
            <TextField
              label={field.proxy.label}
              keyName={field.proxy.key}
              hint={field.proxy.hint}
              value={config.proxy}
              placeholder={field.proxy.placeholder}
              invalid={config.noProxy && Boolean(config.proxy.trim())}
              onChange={(value) => setConfig((current) => ({ ...current, proxy: value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={field.proxyCredentialUsername.label}
                keyName={field.proxyCredentialUsername.key}
                value={config.proxyCredential.username}
                placeholder={field.proxyCredentialUsername.placeholder}
                invalid={config.proxyUseDefaultCredentials && Boolean(config.proxyCredential.username.trim())}
                onChange={(value) => setConfig((current) => ({ ...current, proxyCredential: { ...current.proxyCredential, username: value } }))}
              />
              <TextField
                label={field.proxyCredentialPassword.label}
                keyName={field.proxyCredentialPassword.key}
                value={config.proxyCredential.password}
                placeholder={field.proxyCredentialPassword.placeholder}
                type="password"
                invalid={config.proxyUseDefaultCredentials && Boolean(config.proxyCredential.password.trim())}
                onChange={(value) => setConfig((current) => ({ ...current, proxyCredential: { ...current.proxyCredential, password: value } }))}
              />
            </div>
            <ToggleRow
              label={field.proxyUseDefaultCredentials.label}
              keyName={field.proxyUseDefaultCredentials.key}
              hint={field.proxyUseDefaultCredentials.hint}
              checked={config.proxyUseDefaultCredentials}
              onCheckedChange={(checked) => setConfig((current) => ({ ...current, proxyUseDefaultCredentials: checked }))}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2 font-display text-sm font-semibold uppercase tracking-wider text-fg-muted">
              <ShieldAlert className="h-4 w-4 text-primary" />
              {copy.installGuide.privilegeSection}
            </div>
            {needsAdmin ? (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
                <div className="flex gap-3">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <h4 className="text-sm font-semibold text-fg">{copy.installGuide.adminWarningTitle}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-fg-muted">{copy.installGuide.adminWarningDesc}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <ToggleRow
              label={field.runAsAdmin.label}
              keyName={field.runAsAdmin.key}
              hint={field.runAsAdmin.hint}
              checked={config.runAsAdmin}
              warning={needsAdmin}
              onCheckedChange={(checked) => setConfig((current) => ({ ...current, runAsAdmin: checked }))}
            />
          </section>

          <div className="rounded-lg border border-border bg-bg p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-semibold text-fg">{copy.installGuide.validationTitle}</h3>
              <Badge variant={canConfirm ? 'success' : 'destructive'}>{canConfirm ? copy.common.pass : copy.common.fail}</Badge>
            </div>
            {canConfirm ? (
              <p className="text-sm text-fg-muted">{copy.installGuide.noValidationIssues}</p>
            ) : (
              <ul className="space-y-2 text-sm text-destructive">
                {validationIssues.map((issue) => (
                  <li key={issue} className="flex gap-2">
                    <span>✗</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg-overlay p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-fg-muted">
              <span className="h-2 w-2 rounded-full bg-primary glow-primary" />
              <span>{copy.installGuide.confirmNotice}</span>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline">{copy.common.later}</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" disabled={!canConfirm}>
                    {needsAdmin ? copy.common.confirmInstallAdmin : copy.common.confirmInstall}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{copy.installGuide.dialogTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{copy.installGuide.dialogDesc}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="rounded-lg border border-border bg-bg p-3 font-mono text-xs text-fg-muted">
                    {copy.installGuide.p08Hint}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{copy.installGuide.dialogCancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirmInstall?.(config)}>{copy.installGuide.dialogConfirm}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
