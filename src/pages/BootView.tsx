// P01 · 启动检测与协助安装页(F15/F16/F17/F19)
// 三种子态:检测中 / 未检测到(配置表单 + 失败原因)/ 协助安装中(实时日志)
import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, TriangleAlert } from "lucide-react";

import { t } from "@/i18n";
import { cancelInstallScoop, startInstallScoop, useApp, useLang } from "@/store";
import type { InstallConfig } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface FormState {
  scoopDir: string;
  scoopGlobalDir: string;
  scoopCacheDir: string;
  proxy: string;
  noProxy: string;
  proxyCredentialUser: string;
  proxyCredentialPassword: string;
  proxyUseDefaultCredentials: boolean;
  runAsAdmin: boolean;
}

const emptyForm: FormState = {
  scoopDir: "",
  scoopGlobalDir: "",
  scoopCacheDir: "",
  proxy: "",
  noProxy: "",
  proxyCredentialUser: "",
  proxyCredentialPassword: "",
  proxyUseDefaultCredentials: false,
  runAsAdmin: false,
};

function Field({
  id,
  label,
  help,
  badge,
  value,
  placeholder,
  type,
  onChange,
}: {
  id: string;
  label: string;
  help?: string;
  badge?: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {badge && (
          <Badge variant="warning" className="ml-1.5">
            {badge}
          </Badge>
        )}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        className="font-mono"
        onChange={(e) => onChange(e.target.value)}
      />
      {help && <div className="mt-1 text-xs leading-relaxed text-subtle">{help}</div>}
    </div>
  );
}

export function BootView() {
  useLang();
  const bootStage = useApp((s) => s.boot);
  const setupError = useApp((s) => s.setupError);
  const settings = useApp((s) => s.settings);
  const installJobId = useApp((s) => s.installJobId);
  const jobs = useApp((s) => s.jobs);
  const jobLogs = useApp((s) => s.jobLogs);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 复用上次确认过的安装配置(PRD:确认后的配置本机持久化,重装复用)
  useEffect(() => {
    const cfg = settings?.installConfig;
    if (!cfg) return;
    setForm({
      scoopDir: cfg.scoopDir ?? "",
      scoopGlobalDir: cfg.scoopGlobalDir ?? "",
      scoopCacheDir: cfg.scoopCacheDir ?? "",
      proxy: cfg.proxy ?? "",
      noProxy: cfg.noProxy ?? "",
      proxyCredentialUser: cfg.proxyCredentialUser ?? "",
      proxyCredentialPassword: cfg.proxyCredentialPassword ?? "",
      proxyUseDefaultCredentials: cfg.proxyUseDefaultCredentials,
      runAsAdmin: cfg.runAsAdmin,
    });
  }, [settings]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const installJob = installJobId ? jobs[installJobId] : undefined;
  const installLog = installJobId ? (jobLogs[installJobId] ?? []) : [];

  const logRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [installLog.length]);

  function submit() {
    setConfirmOpen(false);
    const cfg: InstallConfig = {
      scoopDir: form.scoopDir.trim() || null,
      scoopGlobalDir: form.scoopGlobalDir.trim() || null,
      scoopCacheDir: form.scoopCacheDir.trim() || null,
      proxy: form.proxy.trim() || null,
      noProxy: form.noProxy.trim() || null,
      proxyCredentialUser: form.proxyCredentialUser.trim() || null,
      proxyCredentialPassword: form.proxyCredentialPassword || null,
      proxyUseDefaultCredentials: form.proxyUseDefaultCredentials,
      runAsAdmin: form.runAsAdmin,
    };
    void startInstallScoop(cfg);
  }

  const errorText =
    setupError === "failed"
      ? t("setup.failedDesc")
      : setupError === "cancelled"
        ? t("setup.cancelledDesc")
        : setupError === "recheckFailed"
          ? t("setup.recheckFailed")
          : "";

  const installing = bootStage === "installing";

  if (bootStage === "detecting" || bootStage === "init") {
    return (
      <div className="bg-grid relative flex h-full items-center justify-center">
        <div className="bg-glow-top pointer-events-none absolute inset-x-0 top-0 bottom-[60%]" />
        <div className="z-[1] flex flex-col items-center gap-3">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          <div className="text-[15px] font-medium">{t("boot.detecting")}</div>
          <div className="font-mono text-xs text-subtle">{t("boot.detectHint")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-grid relative flex h-full items-center justify-center overflow-auto">
      <div className="bg-glow-top pointer-events-none absolute inset-x-0 top-0 bottom-[60%]" />

      <div className="z-[1] flex max-h-[calc(100vh-80px)] w-[min(720px,calc(100vw-96px))] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)]">
        <div className="gradient-line" />
        <div className="overflow-auto px-7 pt-6 pb-7">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-warning/30 bg-[var(--warning-15)] text-warning">
              {installing ? <Download className="size-6" /> : <TriangleAlert className="size-6" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {installing ? t("setup.installing") : t("setup.notFoundTitle")}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {installing ? t("setup.installingDesc") : t("setup.notFoundDesc")}
              </p>
            </div>
          </div>

          {/* 失败原因(F19:业务语言 + 可重试) */}
          {!installing && errorText && (
            <div className="mt-4 flex gap-2.5 rounded-md border border-destructive/35 bg-[var(--destructive-glow)] px-3.5 py-3 text-[13px] text-destructive">
              <TriangleAlert className="mt-0.5 size-[15px] shrink-0" />
              <div>
                <div className="font-medium">{t("setup.failedTitle")}</div>
                <div className="mt-0.5 text-xs">{errorText}</div>
              </div>
            </div>
          )}

          {installing ? (
            <>
              <Progress className="mt-4 mb-2" value={null} />
              <div ref={logRef} className="log-box h-[260px]">
                {installLog.length ? installLog.join("\n") : <span className="text-subtle">…</span>}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="cancel"
                  disabled={installJob?.state !== "running" && installJob?.state !== "queued"}
                  onClick={cancelInstallScoop}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-6 text-[15px] font-semibold">{t("setup.formTitle")}</h3>
              <p className="mt-1 mb-4 text-xs leading-relaxed text-subtle">{t("setup.formDesc")}</p>

              <div className="flex flex-col gap-3.5">
                <Field
                  id="f-dir"
                  label={t("setup.scoopDir")}
                  help={t("setup.scoopDirHelp")}
                  value={form.scoopDir}
                  placeholder="%USERPROFILE%\scoop"
                  onChange={(v) => patch({ scoopDir: v })}
                />
                <Field
                  id="f-global"
                  label={t("setup.globalDir")}
                  badge={t("setup.adminBadge")}
                  help={t("setup.globalDirHelp")}
                  value={form.scoopGlobalDir}
                  placeholder="C:\ProgramData\scoop"
                  onChange={(v) => patch({ scoopGlobalDir: v, ...(v.trim() ? { runAsAdmin: true } : {}) })}
                />
                <Field
                  id="f-cache"
                  label={t("setup.cacheDir")}
                  help={t("setup.cacheDirHelp")}
                  value={form.scoopCacheDir}
                  placeholder="%SCOOP%\cache"
                  onChange={(v) => patch({ scoopCacheDir: v })}
                />
                <Field
                  id="f-proxy"
                  label={t("setup.proxy")}
                  help={t("setup.proxyHelp")}
                  value={form.proxy}
                  placeholder="http://127.0.0.1:7890"
                  onChange={(v) => patch({ proxy: v })}
                />
                <Field
                  id="f-noproxy"
                  label={t("setup.noProxy")}
                  help={t("setup.noProxyHelp")}
                  value={form.noProxy}
                  placeholder="localhost,127.0.0.1"
                  onChange={(v) => patch({ noProxy: v })}
                />
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Field
                      id="f-puser"
                      label={t("setup.proxyUser")}
                      help={t("setup.proxyCredHelp")}
                      value={form.proxyCredentialUser}
                      onChange={(v) => patch({ proxyCredentialUser: v })}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Field
                      id="f-ppass"
                      label={t("setup.proxyPass")}
                      type="password"
                      value={form.proxyCredentialPassword}
                      onChange={(v) => patch({ proxyCredentialPassword: v })}
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <Checkbox
                    checked={form.proxyUseDefaultCredentials}
                    onCheckedChange={(v) => patch({ proxyUseDefaultCredentials: v === true })}
                  />
                  {t("setup.useDefaultCred")}
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-[13px]">
                  <Checkbox
                    className="mt-0.5"
                    checked={form.runAsAdmin}
                    onCheckedChange={(v) => patch({ runAsAdmin: v === true })}
                  />
                  <span>
                    {t("setup.runAsAdmin")}
                    <span className="mt-0.5 block text-xs leading-relaxed text-subtle">
                      {t("setup.runAsAdminHelp")}
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-5 flex justify-end">
                <Button size="lg" onClick={() => setConfirmOpen(true)}>
                  <Download className="size-[18px]" />
                  {t("setup.startInstall")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 一次性确认(PRD:所有配置项执行前一次性确认) */}
      <ConfirmDialog
        open={confirmOpen}
        title={t("setup.startInstall")}
        message={t("setup.formDesc")}
        confirmText={t("common.confirm")}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
