import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  IPCResult,
  InstallJobState,
  OkResult,
  ProgressEvent,
  ProgressStage,
} from '../../../../../shared/ipc-contract';
import { IpcChannels } from '../../../../../shared/ipc-contract';
import type { JobActionType } from '../store/job-dialog-store';

export type LogLevel = 'info' | 'success' | 'error' | 'muted';

export interface JobLogLine {
  id: string;
  text: string;
  level: LogLevel;
  ts: number;
}

export interface UseJobProgressOptions {
  jobId?: string | null;
  channel?: string;
  target?: string;
  source?: string;
  action?: JobActionType;
  initialState?: InstallJobState;
}

export interface JobProgressView {
  jobId: string;
  channel: string;
  action: JobActionType;
  target: string;
  source?: string;
  state: InstallJobState;
  stage?: ProgressStage;
  percent?: number;
  currentText?: string;
  error?: { code: string; message: string };
  logs: JobLogLine[];
  latestEvent: ProgressEvent | null;
  isTerminal: boolean;
  canCancel: boolean;
  canRetry: boolean;
}

interface ScoopProgressApi {
  onProgress(channel: string, handler: (event: ProgressEvent) => void): () => void;
  cancelJob?: (jobId: string) => Promise<IPCResult<OkResult>>;
  runJob?: (jobId: string) => void;
}

const progressChannels = [
  IpcChannels.SCOOP_ONBOARDING_INSTALL_PROGRESS,
  IpcChannels.SCOOP_APPS_INSTALL_PROGRESS,
  IpcChannels.SCOOP_APPS_UNINSTALL_PROGRESS,
  IpcChannels.SCOOP_APPS_UPDATE_PROGRESS,
  IpcChannels.SCOOP_BUCKETS_ADD_PROGRESS,
  IpcChannels.SCOOP_BUCKETS_REMOVE_PROGRESS,
] as const;

const terminalStates = new Set<InstallJobState>(['succeeded', 'failed', 'cancelled']);

function getScoop(): ScoopProgressApi | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { scoop?: ScoopProgressApi }).scoop;
}

function toProgressChannel(channel?: string): string | null {
  if (!channel) return null;
  if (channel.endsWith(':progress')) return channel;
  if (
    channel.endsWith(':install') ||
    channel.endsWith(':uninstall') ||
    channel.endsWith(':update') ||
    channel.endsWith(':add') ||
    channel.endsWith(':remove')
  ) {
    return `${channel}:progress`;
  }
  return null;
}

function deriveAction(channel?: string, fallback?: JobActionType): JobActionType {
  if (fallback) return fallback;
  if (!channel) return 'custom';
  if (channel === IpcChannels.SCOOP_ONBOARDING_INSTALL) return 'onboardingInstall';
  if (channel === IpcChannels.SCOOP_APPS_INSTALL) return 'install';
  if (channel === IpcChannels.SCOOP_APPS_UNINSTALL) return 'uninstall';
  if (channel === IpcChannels.SCOOP_APPS_UPDATE) return 'update';
  if (channel === IpcChannels.SCOOP_BUCKETS_ADD) return 'addBucket';
  if (channel === IpcChannels.SCOOP_BUCKETS_REMOVE) return 'removeBucket';
  return 'custom';
}

function classifyLog(text: string, state: InstallJobState): LogLevel {
  const lower = text.toLowerCase();
  if (state === 'failed' || lower.includes('error') || lower.includes('failed')) return 'error';
  if (state === 'succeeded' || lower.includes('success') || lower.includes('completed') || lower.includes('ok')) return 'success';
  if (lower.startsWith('[') || lower.includes('stage=')) return 'muted';
  return 'info';
}

function extractTarget(raw: string): string | null {
  const match = raw.match(/(?:Installing|Uninstalling|Updating|Cloning|Removing)\s+'?([^'\s…]+)'?/i);
  return match?.[1] ?? null;
}

function lastPercent(events: ProgressEvent[]): number | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const chunk = events[index]?.chunk;
    if (typeof chunk?.percent === 'number') return chunk.percent;
  }
  return undefined;
}

function lastStage(events: ProgressEvent[]): ProgressStage | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const chunk = events[index]?.chunk;
    if (chunk?.stage) return chunk.stage;
  }
  return undefined;
}

function lastRaw(events: ProgressEvent[]): string | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const chunk = events[index]?.chunk;
    if (chunk?.raw) return chunk.raw;
  }
  return undefined;
}

function appendLogLine(lines: JobLogLine[], line: JobLogLine): JobLogLine[] {
  return [...lines, line].slice(-200);
}

export function useJobProgress(options: UseJobProgressOptions): {
  progress: JobProgressView;
  cancelJob: () => Promise<boolean>;
  retryJob: () => Promise<boolean>;
} {
  const { jobId, channel, target, source, action, initialState = 'queued' } = options;
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [logs, setLogs] = useState<JobLogLine[]>([]);
  const [inferredTarget, setInferredTarget] = useState<string>('');
  const [manualState, setManualState] = useState<InstallJobState | null>(null);

  useEffect(() => {
    setEvents([]);
    setLogs([]);
    setInferredTarget('');
    setManualState(null);
  }, [jobId]);

  useEffect(() => {
    const scoop = getScoop();
    if (!scoop || !jobId) return undefined;

    const specific = toProgressChannel(channel);
    const channels = specific ? [specific] : progressChannels;
    const cleanups = channels.map((progressChannel) =>
      scoop.onProgress(progressChannel, (event) => {
        if (event.jobId !== jobId) return;
        setEvents((current) => [...current, event].slice(-200));
        const chunk = event.chunk;
        if (chunk?.raw) {
          const rawTarget = extractTarget(chunk.raw);
          if (rawTarget) setInferredTarget((current) => current || rawTarget);
          setLogs((current) =>
            appendLogLine(current, {
              id: `${event.jobId}-${event.ts}-${current.length}`,
              text: chunk.raw,
              level: classifyLog(chunk.raw, event.state),
              ts: event.ts,
            }),
          );
        }
        const error = event.error;
        if (error) {
          setLogs((current) =>
            appendLogLine(current, {
              id: `${event.jobId}-${event.ts}-error-${current.length}`,
              text: `${error.code}: ${error.message}`,
              level: 'error',
              ts: event.ts,
            }),
          );
        }
      }),
    );

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [channel, jobId]);

  const latestEvent = events.at(-1) ?? null;
  const latestError = latestEvent?.error;
  const state = latestEvent?.state ?? manualState ?? initialState;
  const isTerminal = terminalStates.has(state);
  const percent = state === 'succeeded' ? 100 : lastPercent(events);
  const resolvedChannel = channel ?? latestEvent?.channel ?? '';
  const currentText = latestError?.message ?? lastRaw(events);

  const progress = useMemo<JobProgressView>(() => {
    return {
      jobId: jobId ?? '',
      channel: resolvedChannel,
      action: deriveAction(resolvedChannel, action),
      target: target ?? inferredTarget,
      source,
      state,
      stage: lastStage(events),
      percent,
      currentText,
      error: latestError
        ? { code: latestError.code, message: latestError.message }
        : undefined,
      logs,
      latestEvent,
      isTerminal,
      canCancel: state === 'queued' || state === 'running',
      canRetry: state === 'failed',
    };
  }, [action, currentText, events, inferredTarget, isTerminal, jobId, latestError, latestEvent, logs, percent, resolvedChannel, source, state, target]);

  const cancelJob = useCallback(async (): Promise<boolean> => {
    const scoop = getScoop();
    if (!scoop?.cancelJob || !jobId) return false;
    const result = await scoop.cancelJob(jobId);
    if (result.ok && result.data.ok) {
      setManualState('cancelled');
      setLogs((current) =>
        appendLogLine(current, {
          id: `${jobId}-${Date.now()}-cancelled`,
          text: 'E_JOB_CANCELLED: cancelled by user',
          level: 'muted',
          ts: Date.now(),
        }),
      );
      return true;
    }
    return false;
  }, [jobId]);

  const retryJob = useCallback(async (): Promise<boolean> => {
    const scoop = getScoop();
    if (!scoop?.runJob || !jobId) return false;
    try {
      scoop.runJob(jobId);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLogs((current) =>
        appendLogLine(current, {
          id: `${jobId}-${Date.now()}-retry-error`,
          text: message,
          level: 'error',
          ts: Date.now(),
        }),
      );
      return false;
    }
  }, [jobId]);

  return { progress, cancelJob, retryJob };
}
