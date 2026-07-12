/**
 * 主进程入口
 * - 单实例锁(app-lifecycle.ts)
 * - 窗口创建(window-manager.ts)
 * - IPC 注册(ipc-router.ts)
 * 详见 `docs/architecture/api/electron/scoop-gui.md` + `ARCHITECTURE.md` §2
 */

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WindowManager } from './window-manager';
import { registerIpcHandlers } from './ipc-router';
import { setupAppLifecycle } from './app-lifecycle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_SERVER_URL = process.env['ELECTRON_RENDERER_URL'];

async function bootstrap(): Promise<void> {
  await app.whenReady();

  if (process.platform !== 'win32') {
    console.error('[scoop-gui] 仅支持 Windows 平台,当前平台拒绝继续:', process.platform);
    app.quit();
    return;
  }

  setupAppLifecycle();
  registerIpcHandlers();

  const windowManager = new WindowManager({
    preload: path.join(__dirname, '../preload/index.js'),
    devServerUrl: DEV_SERVER_URL,
    isDev: !!DEV_SERVER_URL,
  });

  await windowManager.create();
  void BrowserWindow;
}

bootstrap().catch((err) => {
  console.error('[scoop-gui] bootstrap failed', err);
  app.exit(1);
});

app.on('window-all-closed', () => {
  // 主进程严格遵循:仅 macOS 保留应用,Windows/Linux 全部退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const wm = WindowManager.getInstance();
    if (wm) await wm.create();
  }
});
