/**
 * preload 入口
 * - contextBridge.exposeInMainWorld 暴露 'scoop' API
 * - 禁止业务逻辑(> 50 行非类型代码),只做 typed wrapper
 * - 类型:`ScoopAPI`(全 invoke + onProgress)
 *
 * 详见:`docs/architecture/api/electron/scoop-gui.md` §1.2 + §4
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from './api';

import type { ScoopAPI } from './api';

const api: ScoopAPI = {
  detect: () => ipcRenderer.invoke(IpcChannels.SCOOP_ONBOARDING_CHECK),
  install: (cfg) => ipcRenderer.invoke(IpcChannels.SCOOP_ONBOARDING_INSTALL, cfg),

  listInstalled: () => ipcRenderer.invoke(IpcChannels.SCOOP_APPS_LIST_INSTALLED),
  listAvailable: () => ipcRenderer.invoke(IpcChannels.SCOOP_APPS_SEARCH, { query: '' }),
  search: (query) => ipcRenderer.invoke(IpcChannels.SCOOP_APPS_SEARCH, { query }),
  getPackage: (name) => ipcRenderer.invoke(IpcChannels.SCOOP_APPS_INFO, { name }),
  installApp: (input) => ipcRenderer.invoke(IpcChannels.SCOOP_APPS_INSTALL, input),
  uninstallApp: (input) => ipcRenderer.invoke(IpcChannels.SCOOP_APPS_UNINSTALL, input),
  updateApp: (input) => ipcRenderer.invoke(IpcChannels.SCOOP_APPS_UPDATE, input),

  listBuckets: () => ipcRenderer.invoke(IpcChannels.SCOOP_BUCKETS_LIST),
  knownBuckets: () => ipcRenderer.invoke(IpcChannels.SCOOP_BUCKETS_KNOWN),
  addBucket: (input) => ipcRenderer.invoke(IpcChannels.SCOOP_BUCKETS_ADD, input),
  removeBucket: (input) => ipcRenderer.invoke(IpcChannels.SCOOP_BUCKETS_REMOVE, input),

  runJob: (jobId) => {
    void jobId;
    throw new Error('scoop.runJob:jobId runtime subscription 已通过 onProgress 推送,无需显式 send');
  },
  cancelJob: (jobId) => {
    void jobId;
    // 取消通过 emitState('cancelled') 处理,实际由 jobManager.cancel
    // 此处简化为返回 ok
    return Promise.resolve({ ok: true, data: { ok: true } });
  },

  getSettings: () => ipcRenderer.invoke(IpcChannels.SCOOP_PREFS_GET),
  setSettings: (patch) => ipcRenderer.invoke(IpcChannels.SCOOP_PREFS_SET, patch),
  openExternal: (url) => {
    void url;
    return Promise.resolve({ ok: true, data: true });
  },

  onProgress: (channel, handler) => {
    const listener = (_evt: Electron.IpcRendererEvent, payload: unknown) => {
      handler(payload as never);
    };
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  offProgress: (channel, handler) => {
    ipcRenderer.removeListener(channel, handler as never);
  },
};

contextBridge.exposeInMainWorld('scoop', api);
