export type ExportFormat = 'mp4' | 'gif';
export type ExportResolution = '720p' | '1080p' | '2K';
export type ExportQuality = 'low' | 'medium' | 'high';
export type ExportFPS = 30 | 60;

export interface ExportConfig {
  format: ExportFormat;
  duration: number;
  resolution: ExportResolution;
  fps: ExportFPS;
  quality: ExportQuality;
  includeBackground: boolean;
  includeStickers: boolean;
  loop: boolean;
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';
  percent: number;
  currentFrame: number;
  totalFrames: number;
  error?: string;
}

export interface ExportResult {
  url: string;
  blob: Blob;
  filename: string;
  format: ExportFormat;
  size: number;
  duration: number;
}

export interface ResolutionInfo {
  width: number;
  height: number;
  label: string;
}

export const RESOLUTION_MAP: Record<ExportResolution, ResolutionInfo> = {
  '720p': { width: 1280, height: 720, label: '720p (HD)' },
  '1080p': { width: 1920, height: 1080, label: '1080p (Full HD)' },
  '2K': { width: 2560, height: 1440, label: '2K (QHD)' }
};

export const QUALITY_PARAMS: Record<ExportQuality, { crf: number; bitrate: string }> = {
  low: { crf: 30, bitrate: '1M' },
  medium: { crf: 23, bitrate: '4M' },
  high: { crf: 18, bitrate: '8M' }
};
