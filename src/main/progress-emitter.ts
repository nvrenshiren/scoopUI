/**
 * Job 进度推送器
 * 通过 webContents.send 投递 ProgressEvent
 * 渲染端 preload 转发订阅
 */

import { BrowserWindow } from 'electron';
import type { IpcChannelName } from '../shared/ipc-contract';
import type { ProgressEvent } from '../shared/ipc-contract';

export class ProgressEmitter {
  constructor(private readonly getWindow: () => BrowserWindow | null) {}

  emit(event: ProgressEvent, sourceChannel: IpcChannelName): void {
    const win = this.getWindow();
    if (!win || win.isDestroyed()) return;
    const progressChannel = deriveProgressChannel(sourceChannel);
    if (!progressChannel) return;
    win.webContents.send(progressChannel, event);
  }
}

export function deriveProgressChannel(sourceChannel: string): string | null {
  if (sourceChannel.endsWith(':install')) return `${sourceChannel}:progress`;
  if (sourceChannel.endsWith(':uninstall')) return `${sourceChannel}:progress`;
  if (sourceChannel.endsWith(':update')) return `${sourceChannel}:progress`;
  if (sourceChannel.endsWith(':add')) return `${sourceChannel}:progress`;
  if (sourceChannel.endsWith(':remove')) return `${sourceChannel}:progress`;
  return null;
}
