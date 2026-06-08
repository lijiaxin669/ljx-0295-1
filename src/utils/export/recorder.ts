import type { ExportConfig, ExportResult } from '../../types/export';
import { RESOLUTION_MAP } from '../../types/export';

export class CanvasRecorder {
  private canvas: HTMLCanvasElement;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private config: ExportConfig;
  private onProgress: ((currentFrame: number, totalFrames: number) => void) | null = null;
  private animationFrame: number = 0;
  private startTime: number = 0;
  private frameCount: number = 0;
  private totalFrames: number = 0;
  private drawFrame: ((time: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, config: ExportConfig) {
    this.canvas = canvas;
    this.config = config;
  }

  setOnProgress(callback: (currentFrame: number, totalFrames: number) => void): void {
    this.onProgress = callback;
  }

  setDrawFrame(callback: (time: number) => void): void {
    this.drawFrame = callback;
  }

  isSupported(): boolean {
    return !!(window.MediaRecorder && this.canvas.captureStream);
  }

  getSupportedMimeTypes(): string[] {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }

  async start(): Promise<void> {
    const resolution = RESOLUTION_MAP[this.config.resolution];
    const stream = this.canvas.captureStream(this.config.fps);

    if (!stream) {
      throw new Error('Failed to capture canvas stream');
    }

    this.stream = stream;
    this.chunks = [];
    this.frameCount = 0;
    this.totalFrames = this.config.duration * this.config.fps;

    const mimeTypes = this.getSupportedMimeTypes();
    const mimeType = mimeTypes.length > 0 ? mimeTypes[0] : 'video/webm';

    this.recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: this.getBitrate()
    });

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.recorder.start(100);
    this.startTime = performance.now();

    this.animate();
  }

  private getBitrate(): number {
    const base = this.config.resolution === '2K' ? 8000000 :
                 this.config.resolution === '1080p' ? 5000000 : 2500000;
    const multiplier = this.config.quality === 'high' ? 1.5 :
                       this.config.quality === 'low' ? 0.5 : 1;
    return Math.round(base * multiplier);
  }

  private animate = (): void => {
    if (!this.recorder || this.recorder.state !== 'recording') return;

    const elapsed = (performance.now() - this.startTime) / 1000;
    const progress = Math.min(elapsed / this.config.duration, 1);

    if (this.drawFrame) {
      this.drawFrame(progress);
    }

    this.frameCount++;

    if (this.onProgress) {
      this.onProgress(this.frameCount, this.totalFrames);
    }

    if (progress >= 1) {
      this.stop();
      return;
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  async stop(): Promise<Blob> {
    cancelAnimationFrame(this.animationFrame);

    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error('Recorder not started'));
        return;
      }

      this.recorder.onstop = () => {
        const blobType = this.config.format === 'mp4' ? 'video/mp4' : 'video/webm';
        const blob = new Blob(this.chunks, { type: blobType });
        this.cleanup();
        resolve(blob);
      };

      this.recorder.onerror = () => {
        this.cleanup();
        reject(new Error('Recording failed'));
      };

      if (this.recorder.state === 'recording') {
        this.recorder.stop();
      }
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.recorder = null;
    cancelAnimationFrame(this.animationFrame);
  }

  async export(): Promise<ExportResult> {
    const blob = await this.stop();
    const url = URL.createObjectURL(blob);
    const filename = `new-year-card-${Date.now()}.${this.config.format}`;

    return {
      url,
      blob,
      filename,
      format: this.config.format,
      size: blob.size,
      duration: this.config.duration
    };
  }

  cancel(): void {
    cancelAnimationFrame(this.animationFrame);
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.stop();
    }
    this.cleanup();
  }
}

export function downloadExport(result: ExportResult): void {
  const link = document.createElement('a');
  link.href = result.url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function revokeExportUrl(result: ExportResult): void {
  URL.revokeObjectURL(result.url);
}
