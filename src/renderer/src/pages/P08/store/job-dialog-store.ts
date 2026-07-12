import { create } from 'zustand';

export type JobActionType =
  | 'install'
  | 'uninstall'
  | 'update'
  | 'batchUpdate'
  | 'addBucket'
  | 'removeBucket'
  | 'onboardingInstall'
  | 'custom';

export interface JobDialogDescriptor {
  jobId: string;
  channel?: string;
  target?: string;
  source?: string;
  action?: JobActionType;
  logPath?: string;
  onRetry?: () => void | Promise<void>;
  onViewLog?: (jobId: string) => void | Promise<void>;
}

interface JobDialogState {
  activeJobId: string | null;
  activeJob: JobDialogDescriptor | null;
  openJob: (job: JobDialogDescriptor | string) => void;
  closeJob: () => void;
}

export const useJobDialogStore = create<JobDialogState>()((set) => ({
  activeJobId: null,
  activeJob: null,
  openJob: (job) => {
    const next = typeof job === 'string' ? { jobId: job } : job;
    set({ activeJobId: next.jobId, activeJob: next });
  },
  closeJob: () => set({ activeJobId: null, activeJob: null }),
}));
