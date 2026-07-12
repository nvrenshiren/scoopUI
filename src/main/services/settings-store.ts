/**
 * preferences.json 持久化
 * - 路径:`app.getPath('userData')/preferences.json`
 * - 写入时机:WindowManager.create() 读 + 关闭时回写;prefs:set 触发
 * - 校验:PreferencesSchema(ARCH §7.1)
 */

import { app } from 'electron';
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PreferencesSchema, type Preferences } from '../../shared/ipc-contract';

const DEFAULTS: Preferences = {
  uiLanguage: 'zh-CN',
  onboardingCompleted: false,
};

function file(): string {
  return path.join(app.getPath('userData'), 'preferences.json');
}

export class SettingsStore {
  private static instance: SettingsStore | null = null;
  private cache: Preferences = DEFAULTS;

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
      SettingsStore.instance.load();
    }
    return SettingsStore.instance;
  }

  private constructor() {}

  private load(): void {
    const p = file();
    if (!existsSync(p)) {
      this.cache = { ...DEFAULTS };
      return;
    }
    try {
      const raw = JSON.parse(readFileSync(p, 'utf-8')) as unknown;
      const parsed = PreferencesSchema.parse(raw);
      this.cache = parsed;
    } catch (cause) {
      console.warn('[scoop-gui] preferences.json invalid, fallback to defaults', cause);
      this.cache = { ...DEFAULTS };
    }
  }

  private save(): void {
    const p = file();
    const dir = path.dirname(p);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(p, JSON.stringify(this.cache, null, 2), 'utf-8');
  }

  getPreferences(): Preferences {
    return { ...this.cache };
  }

  updatePreferences(patch: Partial<Preferences>): Preferences {
    this.cache = {
      ...this.cache,
      ...patch,
      // 深度合并 scoopInstallConfig
      scoopInstallConfig: patch.scoopInstallConfig
        ? { ...(this.cache.scoopInstallConfig ?? {}), ...patch.scoopInstallConfig }
        : this.cache.scoopInstallConfig,
    };
    // 校验合并后的结果
    const validated = PreferencesSchema.parse(this.cache);
    this.cache = validated;
    this.save();
    return { ...this.cache };
  }
}
