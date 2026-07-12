/**
 * 应用生命周期(单实例锁、菜单、退出策略)
 * 详见 ARCHITECTURE.md §3.3 + TECH.md §11(仅 Windows)
 */

import { app, Menu } from 'electron';

export function setupAppLifecycle(): void {
  // 单实例锁
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    // 主实例收到第二份启动请求 → 唤起/聚焦窗口
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WindowManager } = require('./window-manager') as typeof import('./window-manager');
    const wm = WindowManager.getInstance();
    if (wm) wm.show();
  });

  // 退出前清理
  app.on('before-quit', () => {
    // 后续阶段:关闭所有 InstallJob(取消子进程)
  });

  // 设置应用菜单(简化版,避免 macOS 默认菜单污染 Windows)
  if (process.platform === 'win32') {
    Menu.setApplicationMenu(null);
  }
}
