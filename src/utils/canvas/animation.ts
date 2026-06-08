import type { Stroke } from '../../types/canvas';

export class StrokeAnimationPlayer {
  private strokes: Stroke[];
  private duration: number;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;
  private animationFrame: number = 0;
  private onProgress: ((progress: number) => void) | null = null;
  private onComplete: (() => void) | null = null;
  private speed: number = 1;
  private loop: boolean = false;

  constructor(strokes: Stroke[], duration: number = 15) {
    this.strokes = strokes;
    this.duration = duration;
  }

  setStrokes(strokes: Stroke[]): void {
    this.strokes = strokes;
  }

  setDuration(duration: number): void {
    this.duration = duration;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  setOnProgress(callback: (progress: number) => void): void {
    this.onProgress = callback;
  }

  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  play(startProgress: number = 0): void {
    if (this.strokes.length === 0) return;

    this.isPlaying = true;
    this.startTime = performance.now() - startProgress * this.duration * 1000 / this.speed;
    this.pausedTime = 0;
    this.animate();
  }

  pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.pausedTime = performance.now();
    cancelAnimationFrame(this.animationFrame);
  }

  resume(): void {
    if (this.isPlaying || this.pausedTime === 0) return;

    this.isPlaying = true;
    this.startTime += performance.now() - this.pausedTime;
    this.pausedTime = 0;
    this.animate();
  }

  stop(): void {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationFrame);
    this.pausedTime = 0;
    if (this.onProgress) {
      this.onProgress(0);
    }
  }

  seek(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    if (this.onProgress) {
      this.onProgress(clampedProgress);
    }

    if (this.isPlaying) {
      this.startTime = performance.now() - clampedProgress * this.duration * 1000 / this.speed;
    }
  }

  private animate = (): void => {
    if (!this.isPlaying) return;

    const elapsed = (performance.now() - this.startTime) * this.speed;
    const progress = Math.min(elapsed / (this.duration * 1000), 1);

    if (this.onProgress) {
      this.onProgress(progress);
    }

    if (progress >= 1) {
      if (this.loop) {
        this.startTime = performance.now();
        if (this.onComplete) {
          this.onComplete();
        }
      } else {
        this.isPlaying = false;
        if (this.onComplete) {
          this.onComplete();
        }
        return;
      }
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  getProgress(): number {
    if (!this.isPlaying && this.pausedTime > 0) {
      return Math.min((this.pausedTime - this.startTime) * this.speed / (this.duration * 1000), 1);
    }
    if (this.startTime === 0) return 0;
    return Math.min((performance.now() - this.startTime) * this.speed / (this.duration * 1000), 1);
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationFrame);
    this.onProgress = null;
    this.onComplete = null;
  }
}

export function preprocessStrokesForAnimation(strokes: Stroke[], targetDuration: number): Stroke[] {
  if (strokes.length === 0) return [];

  const totalOriginalDuration = strokes.reduce((sum, s) => {
    if (s.points.length < 2) return sum;
    const first = s.points[0].timestamp;
    const last = s.points[s.points.length - 1].timestamp;
    return sum + (last - first);
  }, 0);

  if (totalOriginalDuration === 0) return strokes;

  const scaleFactor = (targetDuration * 1000) / totalOriginalDuration;
  let accumulatedTimestamp = 0;

  return strokes.map(stroke => {
    if (stroke.points.length < 2) return stroke;

    const first = stroke.points[0].timestamp;
    const scaledPoints = stroke.points.map((p, i) => {
      const originalOffset = p.timestamp - first;
      const scaledOffset = originalOffset * scaleFactor;
      return {
        ...p,
        timestamp: accumulatedTimestamp + scaledOffset
      };
    });

    accumulatedTimestamp = scaledPoints[scaledPoints.length - 1].timestamp + 100;
    return { ...stroke, points: scaledPoints };
  });
}

export function getStrokePointsAtProgress(
  stroke: Stroke,
  progress: number
): { x: number; y: number; pressure: number }[] {
  if (stroke.points.length === 0) return [];
  if (progress >= 1) return stroke.points;

  const visibleCount = Math.max(1, Math.floor(stroke.points.length * progress));
  return stroke.points.slice(0, visibleCount);
}
