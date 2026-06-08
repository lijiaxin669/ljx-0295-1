import { writable, derived } from 'svelte/store';
import type { ExportConfig, ExportProgress, ExportResult } from '../types/export';

const defaultConfig: ExportConfig = {
  format: 'mp4',
  duration: 15,
  resolution: '1080p',
  fps: 30,
  quality: 'medium',
  includeBackground: true,
  includeStickers: true,
  loop: true
};

const defaultProgress: ExportProgress = {
  status: 'idle',
  percent: 0,
  currentFrame: 0,
  totalFrames: 0
};

const createExportStore = () => {
  const { subscribe, set, update } = writable<ExportConfig>(defaultConfig);
  const progress = writable<ExportProgress>(defaultProgress);
  const result = writable<ExportResult | null>(null);
  const showModal = writable(false);

  return {
    subscribe,
    progress,
    result,
    showModal,

    setFormat: (format: 'mp4' | 'gif') => update(c => ({ ...c, format })),
    setDuration: (duration: number) => update(c => ({ ...c, duration })),
    setResolution: (resolution: '720p' | '1080p' | '2K') => update(c => ({ ...c, resolution })),
    setFps: (fps: 30 | 60) => update(c => ({ ...c, fps })),
    setQuality: (quality: 'low' | 'medium' | 'high') => update(c => ({ ...c, quality })),
    setIncludeBackground: (v: boolean) => update(c => ({ ...c, includeBackground: v })),
    setIncludeStickers: (v: boolean) => update(c => ({ ...c, includeStickers: v })),
    setLoop: (loop: boolean) => update(c => ({ ...c, loop })),
    setConfig: (config: Partial<ExportConfig>) => update(c => ({ ...c, ...config })),

    startProgress: (totalFrames: number) =>
      progress.set({
        status: 'preparing',
        percent: 0,
        currentFrame: 0,
        totalFrames
      }),

    updateProgress: (currentFrame: number, status?: ExportProgress['status']) =>
      progress.update(p => ({
        ...p,
        status: status || p.status,
        currentFrame,
        percent: Math.round((currentFrame / p.totalFrames) * 100)
      })),

    setStatus: (status: ExportProgress['status']) =>
      progress.update(p => ({ ...p, status })),

    setError: (error: string) =>
      progress.update(p => ({ ...p, status: 'error', error })),

    setResult: (r: ExportResult | null) => result.set(r),

    openModal: () => showModal.set(true),
    closeModal: () => showModal.set(false),

    reset: () => {
      set(defaultConfig);
      progress.set(defaultProgress);
      result.set(null);
      showModal.set(false);
    }
  };
};

export const exportStore = createExportStore();

export const exportConfig = derived(exportStore, $e => $e);

export const exportProgress = derived(exportStore.progress, $p => $p);

export const isExporting = derived(
  exportStore.progress,
  $p => $p.status === 'preparing' || $p.status === 'rendering' || $p.status === 'encoding'
);
