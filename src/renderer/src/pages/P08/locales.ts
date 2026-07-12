import type { InstallJobState, ProgressStage } from '../../../../shared/ipc-contract';
import type { JobActionType } from './store/job-dialog-store';

export type Lang = 'zh-CN' | 'en-US';

type OperationCopy = Record<InstallJobState | 'label', string>;

export interface P08Copy {
  labels: {
    target: string;
    source: string;
    stage: string;
    rawLog: string;
    fullLog: string;
    jobId: string;
    progress: string;
    unknownTarget: string;
    unknownSource: string;
    noLog: string;
    copiedLog: string;
  };
  actions: {
    cancel: string;
    close: string;
    done: string;
    viewFullLog: string;
    retry: string;
    runInBackground: string;
  };
  states: Record<InstallJobState, string>;
  stages: Record<ProgressStage | 'unknown', string>;
  operations: Record<JobActionType, OperationCopy>;
  messages: {
    failed: string;
    cancelled: string;
    running: string;
    succeeded: string;
    retryUnavailable: string;
  };
}

const zh: P08Copy = {
  labels: {
    target: '目标对象',
    source: '源',
    stage: '当前阶段',
    rawLog: '原始日志',
    fullLog: '完整日志',
    jobId: '任务',
    progress: '进度',
    unknownTarget: '未知对象',
    unknownSource: '默认源',
    noLog: '等待进度事件...',
    copiedLog: '日志已复制',
  },
  actions: {
    cancel: '取消',
    close: '关闭',
    done: '完成',
    viewFullLog: '查看完整日志',
    retry: '重试',
    runInBackground: '后台运行',
  },
  states: {
    queued: '排队中',
    running: '进行中',
    succeeded: '成功',
    failed: '失败',
    cancelled: '已取消',
  },
  stages: {
    downloading: '下载中',
    extracting: '解压中',
    installing: '安装中',
    uninstalling: '卸载中',
    updating: '更新中',
    cloning: '克隆中',
    removing: '移除中',
    message: '执行中',
    unknown: '等待中',
  },
  operations: {
    install: {
      label: '安装',
      queued: '等待安装',
      running: '正在安装',
      succeeded: '安装完成',
      failed: '安装失败',
      cancelled: '安装已取消',
    },
    uninstall: {
      label: '卸载',
      queued: '等待卸载',
      running: '正在卸载',
      succeeded: '卸载完成',
      failed: '卸载失败',
      cancelled: '卸载已取消',
    },
    update: {
      label: '更新',
      queued: '等待更新',
      running: '正在更新',
      succeeded: '更新完成',
      failed: '更新失败',
      cancelled: '更新已取消',
    },
    batchUpdate: {
      label: '批量更新',
      queued: '等待批量更新',
      running: '正在批量更新',
      succeeded: '批量更新完成',
      failed: '批量更新失败',
      cancelled: '批量更新已取消',
    },
    addBucket: {
      label: '添加桶',
      queued: '等待添加桶',
      running: '正在添加桶',
      succeeded: '桶添加完成',
      failed: '桶添加失败',
      cancelled: '桶添加已取消',
    },
    removeBucket: {
      label: '移除桶',
      queued: '等待移除桶',
      running: '正在移除桶',
      succeeded: '桶移除完成',
      failed: '桶移除失败',
      cancelled: '桶移除已取消',
    },
    onboardingInstall: {
      label: '协助安装 Scoop',
      queued: '等待安装 Scoop',
      running: '正在安装 Scoop',
      succeeded: 'Scoop 安装完成',
      failed: 'Scoop 安装失败',
      cancelled: 'Scoop 安装已取消',
    },
    custom: {
      label: '执行任务',
      queued: '等待执行',
      running: '正在执行',
      succeeded: '执行完成',
      failed: '执行失败',
      cancelled: '执行已取消',
    },
  },
  messages: {
    failed: 'Scoop 命令执行失败。请查看日志后重试。',
    cancelled: '已取消。目标对象保持动作前的状态。',
    running: '任务仍在推进，可关闭对话框继续在后台运行。',
    succeeded: '任务已完成，关闭后返回来源页刷新最新状态。',
    retryUnavailable: '当前任务缺少重试入口。',
  },
};

const en: P08Copy = {
  labels: {
    target: 'Target',
    source: 'Source',
    stage: 'Stage',
    rawLog: 'Raw log',
    fullLog: 'Full log',
    jobId: 'Job',
    progress: 'Progress',
    unknownTarget: 'Unknown target',
    unknownSource: 'Default source',
    noLog: 'Waiting for progress events...',
    copiedLog: 'Log copied',
  },
  actions: {
    cancel: 'Cancel',
    close: 'Close',
    done: 'Done',
    viewFullLog: 'View full log',
    retry: 'Retry',
    runInBackground: 'Run in background',
  },
  states: {
    queued: 'Queued',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    cancelled: 'Cancelled',
  },
  stages: {
    downloading: 'Downloading',
    extracting: 'Extracting',
    installing: 'Installing',
    uninstalling: 'Uninstalling',
    updating: 'Updating',
    cloning: 'Cloning',
    removing: 'Removing',
    message: 'Running',
    unknown: 'Waiting',
  },
  operations: {
    install: {
      label: 'Install',
      queued: 'Waiting to install',
      running: 'Installing',
      succeeded: 'Install completed',
      failed: 'Install failed',
      cancelled: 'Install cancelled',
    },
    uninstall: {
      label: 'Uninstall',
      queued: 'Waiting to uninstall',
      running: 'Uninstalling',
      succeeded: 'Uninstall completed',
      failed: 'Uninstall failed',
      cancelled: 'Uninstall cancelled',
    },
    update: {
      label: 'Update',
      queued: 'Waiting to update',
      running: 'Updating',
      succeeded: 'Update completed',
      failed: 'Update failed',
      cancelled: 'Update cancelled',
    },
    batchUpdate: {
      label: 'Batch update',
      queued: 'Waiting for batch update',
      running: 'Batch updating',
      succeeded: 'Batch update completed',
      failed: 'Batch update failed',
      cancelled: 'Batch update cancelled',
    },
    addBucket: {
      label: 'Add bucket',
      queued: 'Waiting to add bucket',
      running: 'Adding bucket',
      succeeded: 'Bucket added',
      failed: 'Bucket add failed',
      cancelled: 'Bucket add cancelled',
    },
    removeBucket: {
      label: 'Remove bucket',
      queued: 'Waiting to remove bucket',
      running: 'Removing bucket',
      succeeded: 'Bucket removed',
      failed: 'Bucket remove failed',
      cancelled: 'Bucket remove cancelled',
    },
    onboardingInstall: {
      label: 'Install Scoop',
      queued: 'Waiting to install Scoop',
      running: 'Installing Scoop',
      succeeded: 'Scoop installed',
      failed: 'Scoop install failed',
      cancelled: 'Scoop install cancelled',
    },
    custom: {
      label: 'Run job',
      queued: 'Waiting to run',
      running: 'Running',
      succeeded: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    },
  },
  messages: {
    failed: 'Scoop command failed. See logs and retry.',
    cancelled: 'Cancelled. Target object remains in pre-action state.',
    running: 'The job is still running. You can close this dialog and keep it in background.',
    succeeded: 'The job completed. Close and refresh the source page.',
    retryUnavailable: 'Retry is unavailable for this job.',
  },
};

const locales: Record<Lang, P08Copy> = {
  'zh-CN': zh,
  'en-US': en,
};

export function pickLocale(lang?: string): P08Copy {
  return lang?.startsWith('en') ? locales['en-US'] : locales['zh-CN'];
}

export function stateLabel(copy: P08Copy, state: InstallJobState): string {
  return copy.states[state];
}

export function stageLabel(copy: P08Copy, stage?: ProgressStage): string {
  return stage ? copy.stages[stage] : copy.stages.unknown;
}

export function operationTitle(copy: P08Copy, action: JobActionType, state: InstallJobState): string {
  return copy.operations[action][state];
}
