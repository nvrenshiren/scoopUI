/**
 * IPC Router:注册所有 handle 通道
 * 单一出处:`docs/architecture/api/electron/scoop-gui.md` §4 + TECH.md §10
 */

import { ipcMain } from 'electron';
import {
  IpcChannels,
  EmptyInputSchema,
  SearchInputSchema,
  InfoInputSchema,
  InstallAppInputSchema,
  UninstallAppInputSchema,
  UpdateAppInputSchema,
  BucketAddInputSchema,
  BucketRemoveInputSchema,
  PrefsSetInputSchema,
} from '../shared/ipc-contract';
import { type IPCResult, ok, err, errFromZod } from '../shared/ipc-result';
import { ScoopService } from './services/scoop-service';
import { SettingsStore } from './services/settings-store';
import { JobManager } from './services/job-manager';
import { ProgressEmitter } from './progress-emitter';
import { WindowManager } from './window-manager';
import { ErrorCode } from '../shared/enums';

let registered = false;

export function registerIpcHandlers(): void {
  if (registered) return;
  registered = true;

  const settings = SettingsStore.getInstance();
  const jobManager = JobManager.getInstance();
  const scoopService = new ScoopService();
  const progressEmitter = new ProgressEmitter(() => {
    const wm = WindowManager.getInstance();
    return wm ? wm.getMainWindow() : null;
  });

  const handle = <TInput, TData>(
    channel: string,
    inputSchema: { safeParse: (v: unknown) => { success: boolean; data?: TInput } } | null,
    handler: (input: TInput) => Promise<IPCResult<TData>>,
  ): void => {
    ipcMain.handle(channel, async (_evt, payload: unknown): Promise<IPCResult<TData>> => {
      const t0 = Date.now();
      console.log(`[ipc] → ${channel}`, payload === undefined ? '(no payload)' : '');
      try {
        const normalized = payload ?? {};
        if (inputSchema) {
          const result = inputSchema.safeParse(normalized);
          if (!result.success) {
            console.log(`[ipc] ← ${channel} E_IPC_INVALID_INPUT ${Date.now() - t0}ms`);
            return errFromZod(normalized) as IPCResult<TData>;
          }
        }
        const result = await handler(normalized as TInput);
        const ms = Date.now() - t0;
        if (result.ok) {
          const len = Array.isArray(result.data) ? `${result.data.length} rows` : typeof result.data;
          console.log(`[ipc] ← ${channel} OK ${ms}ms (${len})`);
        } else {
          console.log(`[ipc] ← ${channel} ${result.error.code} ${ms}ms — ${result.error.message}`);
        }
        return result;
      } catch (cause) {
        console.log(`[ipc] ← ${channel} EXCEPTION ${Date.now() - t0}ms`, cause);
        return err(ErrorCode.ScoopInstallFailed, 'Unexpected handler error', cause);
      }
    });
  };

  // ── onboarding ───────────────────────────────────────────────
  handle(IpcChannels.SCOOP_ONBOARDING_CHECK, EmptyInputSchema, async () => {
    return scoopService.detect();
  });
  handle(IpcChannels.SCOOP_ONBOARDING_INSTALL, EmptyInputSchema, async (raw) => {
    const cfg = (raw ?? {}) as import('../shared/ipc-contract').ScoopInstallConfig;
    void cfg;
    return scoopService.installScoop(undefined);
  });

  // ── apps: 读 ──────────────────────────────────────────────────
  handle(IpcChannels.SCOOP_APPS_LIST_INSTALLED, EmptyInputSchema, async () =>
    scoopService.listInstalled(),
  );
  handle(IpcChannels.SCOOP_APPS_SEARCH, SearchInputSchema, async (input) =>
    scoopService.search(input),
  );
  handle(IpcChannels.SCOOP_APPS_INFO, InfoInputSchema, async (input) =>
    scoopService.getPackage(input),
  );
  handle(IpcChannels.SCOOP_APPS_STATUS, EmptyInputSchema, async () =>
    scoopService.listStatus(),
  );

  // ── apps: 写 ──────────────────────────────────────────────────
  handle(IpcChannels.SCOOP_APPS_INSTALL, InstallAppInputSchema, async (input) =>
    jobManager.startJob({
      sourceChannel: IpcChannels.SCOOP_APPS_INSTALL,
      input,
      run: (jobId, emit) => scoopService.installApp(input, jobId, emit),
    }),
  );
  handle(IpcChannels.SCOOP_APPS_UNINSTALL, UninstallAppInputSchema, async (input) =>
    jobManager.startJob({
      sourceChannel: IpcChannels.SCOOP_APPS_UNINSTALL,
      input,
      run: (jobId, emit) => scoopService.uninstallApp(input, jobId, emit),
    }),
  );
  handle(IpcChannels.SCOOP_APPS_UPDATE, UpdateAppInputSchema, async (input) =>
    jobManager.startJob({
      sourceChannel: IpcChannels.SCOOP_APPS_UPDATE,
      input,
      run: (jobId, emit) => scoopService.updateApp(input, jobId, emit),
    }),
  );

  // ── buckets ───────────────────────────────────────────────────
  handle(IpcChannels.SCOOP_BUCKETS_LIST, EmptyInputSchema, async () =>
    scoopService.listBuckets(),
  );
  handle(IpcChannels.SCOOP_BUCKETS_KNOWN, EmptyInputSchema, async () =>
    scoopService.listKnownBuckets(),
  );
  handle(IpcChannels.SCOOP_BUCKETS_ADD, BucketAddInputSchema, async (input) =>
    jobManager.startJob({
      sourceChannel: IpcChannels.SCOOP_BUCKETS_ADD,
      input,
      run: (jobId, emit) => scoopService.addBucket(input, jobId, emit),
    }),
  );
  handle(IpcChannels.SCOOP_BUCKETS_REMOVE, BucketRemoveInputSchema, async (input) =>
    jobManager.startJob({
      sourceChannel: IpcChannels.SCOOP_BUCKETS_REMOVE,
      input,
      run: (jobId, emit) => scoopService.removeBucket(input, jobId, emit),
    }),
  );

  // ── prefs ─────────────────────────────────────────────────────
  handle(IpcChannels.SCOOP_PREFS_GET, EmptyInputSchema, async () => {
    return ok(settings.getPreferences());
  });
  handle(IpcChannels.SCOOP_PREFS_SET, PrefsSetInputSchema, async (input) => {
    try {
      const merged = settings.updatePreferences(input);
      return ok(merged);
    } catch (cause) {
      return err(ErrorCode.PreferencesWriteFailed, 'Preferences write failed', cause);
    }
  });

  void progressEmitter; // 预留给后续握手
}

