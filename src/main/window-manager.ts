/**
 * 窗口管理(singleton)
 * 职责:创建/展示/隐藏/关闭窗口,记住 bounds(写入 Preferences)
 * 不懂 scoop,与 `ARCHITECTURE.md` §2.1(进程拓扑)+§4(模块边界)一致
 */

import { BrowserWindow } from 'electron';
import path from 'node:path';
import type { Preferences, WindowBounds } from '../shared/ipc-contract';
import { SettingsStore } from './services/settings-store';

interface WindowManagerOptions {
  preload: string;
  devServerUrl?: string | undefined;
  isDev: boolean;
}

export class WindowManager {
  private static instance: WindowManager | null = null;
  private mainWindow: BrowserWindow | null = null;
  private readonly opts: WindowManagerOptions;
  private readonly settings: SettingsStore;

  constructor(opts: WindowManagerOptions) {
    this.opts = opts;
    this.settings = SettingsStore.getInstance();
    WindowManager.instance = this;
  }

  static getInstance(): WindowManager | null {
    return WindowManager.instance;
  }

  async create(): Promise<BrowserWindow> {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.show();
      return this.mainWindow;
    }

    const prefs = this.settings.getPreferences();
    const bounds = this.resolveBounds(prefs);

    const win = new BrowserWindow({
      x: bounds?.x,
      y: bounds?.y,
      width: bounds?.width ?? 1280,
      height: bounds?.height ?? 800,
      minWidth: 1024,
      minHeight: 600,
      show: false,
      backgroundColor: '#0B1220',
      title: 'Scoop GUI',
      autoHideMenuBar: true,
      webPreferences: {
        preload: this.opts.preload,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
      },
    });

    win.once('ready-to-show', () => win.show());

    win.on('close', () => {
      const b = win.getBounds();
      this.settings.updatePreferences({ windowBounds: this.toBounds(b) });
    });

    win.on('closed', () => {
      if (this.mainWindow === win) {
        this.mainWindow = null;
      }
    });

    if (this.opts.isDev) {
      await win.loadURL(this.opts.devServerUrl ?? 'http://localhost:5173');
      win.webContents.openDevTools({ mode: 'detach' });
    } else {
      const indexHtml = path.join(__dirname, '../renderer/index.html');
      // 生产:加载打包后的 html
      await win.loadFile(indexHtml);
    }

    this.mainWindow = win;
    return win;
  }

  show(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    if (this.mainWindow.isMinimized()) this.mainWindow.restore();
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  hide(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    this.mainWindow.hide();
  }

  close(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    this.mainWindow.close();
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private resolveBounds(prefs: Preferences): WindowBounds | undefined {
    if (!prefs.windowBounds) return undefined;
    return prefs.windowBounds;
  }

  private toBounds(b: Electron.Rectangle): WindowBounds {
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  }
}
