import type { Stroke, StrokePoint, Template } from '../../types/canvas';
import type { Sticker } from '../../types/sticker';
import type { TextLayer } from '../../types/text';
import { getStickerTransformMatrix, getTransformedCorners } from '../math';
import { getFontFamily } from '../../data/fonts';
import { getTextAlignOffset } from '../../stores/textLayerStore';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private scale: number;

  constructor(canvas: HTMLCanvasElement, width: number, height: number, scale: number = 1) {
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.scale = scale;

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    this.ctx.scale(scale, scale);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(template: Template): void {
    const ctx = this.ctx;
    ctx.save();

    if (template.background.startsWith('linear-gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
      const colors = template.background.match(/#[A-Fa-f0-9]{6}/g) || ['#C41E3A', '#8B0000'];
      colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = template.background;
    }
    ctx.fillRect(0, 0, this.width, this.height);

    template.decorations.forEach(dec => {
      ctx.globalAlpha = dec.opacity;
      if (dec.type === 'pattern') {
        this.drawCloudPattern(dec.position.x, dec.position.y, dec.size.width, dec.size.height, dec.color);
      } else if (dec.type === 'shape') {
        ctx.fillStyle = dec.color;
        ctx.beginPath();
        ctx.arc(dec.position.x + dec.size.width / 2, dec.position.y + dec.size.height / 2, dec.size.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawCloudPattern(x: number, y: number, w: number, h: number, color: string): void {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < this.width; i += w) {
      for (let j = 0; j < this.height; j += h) {
        ctx.beginPath();
        ctx.moveTo(i + 20, j + 40);
        ctx.bezierCurveTo(i + 10, j + 40, i + 10, j + 25, i + 30, j + 25);
        ctx.bezierCurveTo(i + 30, j + 10, i + 55, j + 10, i + 60, j + 25);
        ctx.bezierCurveTo(i + 80, j + 20, i + 90, j + 40, i + 70, j + 45);
        ctx.bezierCurveTo(i + 85, j + 55, i + 70, j + 65, i + 55, j + 60);
        ctx.bezierCurveTo(i + 40, j + 70, i + 20, j + 60, i + 20, j + 40);
        ctx.stroke();
      }
    }
  }

  drawStroke(stroke: Stroke, progress: number = 1): void {
    if (stroke.points.length < 2) return;

    const ctx = this.ctx;
    const totalPoints = stroke.points.length;
    const visiblePoints = Math.max(2, Math.ceil(totalPoints * progress));

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = stroke.lineCap;
    ctx.lineJoin = stroke.lineJoin;
    ctx.globalAlpha = stroke.opacity;

    if (stroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < visiblePoints; i++) {
      const p0 = stroke.points[i - 2] || stroke.points[0];
      const p1 = stroke.points[i - 1];
      const p2 = stroke.points[i];
      const p3 = stroke.points[i + 1] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  drawStrokes(strokes: Stroke[], animationProgress: number = 1): void {
    const totalDuration = this.calculateTotalDuration(strokes);
    const currentTime = animationProgress * totalDuration;

    let accumulatedTime = 0;
    for (const stroke of strokes) {
      const strokeDuration = this.getStrokeDuration(stroke);

      if (currentTime >= accumulatedTime + strokeDuration) {
        this.drawStroke(stroke, 1);
      } else if (currentTime > accumulatedTime) {
        const strokeProgress = (currentTime - accumulatedTime) / strokeDuration;
        this.drawStroke(stroke, strokeProgress);
        break;
      }

      accumulatedTime += strokeDuration;
    }
  }

  drawSticker(sticker: Sticker, img: HTMLImageElement, selected: boolean = false): void {
    const ctx = this.ctx;
    ctx.save();

    const matrix = getStickerTransformMatrix(
      sticker.x, sticker.y, sticker.rotation, sticker.scale,
      sticker.flipX, sticker.flipY
    );

    ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    ctx.globalAlpha = sticker.opacity;

    const hw = sticker.width / 2;
    const hh = sticker.height / 2;
    ctx.drawImage(img, -hw, -hh, sticker.width, sticker.height);

    ctx.restore();

    if (selected) {
      this.drawStickerSelection(sticker);
    }
  }

  drawStickerSelection(sticker: Sticker): void {
    const ctx = this.ctx;
    ctx.save();

    const matrix = getStickerTransformMatrix(
      sticker.x, sticker.y, sticker.rotation, sticker.scale,
      sticker.flipX, sticker.flipY
    );
    const corners = getTransformedCorners(sticker.width, sticker.height, matrix);

    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.forEach(c => ctx.lineTo(c.x, c.y));
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = '#4A90D9';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    corners.forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    const topCenter = {
      x: (corners[0].x + corners[1].x) / 2,
      y: (corners[0].y + corners[1].y) / 2 - 20
    };
    ctx.beginPath();
    ctx.moveTo(topCenter.x, topCenter.y - 10);
    ctx.lineTo(topCenter.x, topCenter.y + 10);
    ctx.moveTo(topCenter.x - 10, topCenter.y);
    ctx.lineTo(topCenter.x + 10, topCenter.y);
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(topCenter.x, topCenter.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  drawTextLayer(text: TextLayer, selected: boolean = false, charProgress: number = 1): void {
    if (text.hidden) return;

    const ctx = this.ctx;
    ctx.save();

    const matrix = getStickerTransformMatrix(
      text.x, text.y, text.rotation, text.scale,
      false, false
    );

    ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    ctx.globalAlpha = text.opacity;

    const fontFamily = getFontFamily(text.fontFamily);
    const fontSize = text.fontSize;
    const fontWeight = text.fontWeight;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = text.color;
    ctx.textBaseline = 'top';

    const offset = getTextAlignOffset(text.textAlign, text.width, text.height);
    const lines = text.content.split('\n');

    if (text.writingMode === 'horizontal') {
      const lineHeight = fontSize * text.lineHeight;
      lines.forEach((line, lineIndex) => {
        const charsToShow = charProgress >= 1
          ? line.length
          : Math.min(line.length, Math.floor(charProgress * line.length * lines.length) - lineIndex * line.length);

        if (charsToShow > 0) {
          const visibleText = line.substring(0, charsToShow);
          let x = offset.x;
          if (text.textAlign.includes('center')) {
            x += (text.width - ctx.measureText(line).width) / 2;
          } else if (text.textAlign.includes('right')) {
            x += text.width - ctx.measureText(line).width;
          }
          ctx.fillText(visibleText, x, offset.y + lineIndex * lineHeight);
        }
      });
    } else {
      const charWidth = fontSize * text.lineHeight;
      lines.forEach((line, lineIndex) => {
        const charsToShow = charProgress >= 1
          ? line.length
          : Math.min(line.length, Math.floor(charProgress * line.length * lines.length) - lineIndex * line.length);

        for (let i = 0; i < charsToShow; i++) {
          const char = line[i];
          const x = offset.x + lineIndex * charWidth + (charWidth - fontSize) / 2;
          const y = offset.y + i * fontSize;
          ctx.fillText(char, x, y);
        }
      });
    }

    ctx.restore();

    if (selected && !text.locked) {
      this.drawTextSelection(text);
    }
  }

  drawTextSelection(text: TextLayer): void {
    const ctx = this.ctx;
    ctx.save();

    const matrix = getStickerTransformMatrix(
      text.x, text.y, text.rotation, text.scale,
      false, false
    );
    const corners = getTransformedCorners(text.width, text.height, matrix);

    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.forEach(c => ctx.lineTo(c.x, c.y));
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = '#4A90D9';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    corners.forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    const topCenter = {
      x: (corners[0].x + corners[1].x) / 2,
      y: (corners[0].y + corners[1].y) / 2 - 20
    };
    ctx.beginPath();
    ctx.moveTo(topCenter.x, topCenter.y - 10);
    ctx.lineTo(topCenter.x, topCenter.y + 10);
    ctx.moveTo(topCenter.x - 10, topCenter.y);
    ctx.lineTo(topCenter.x + 10, topCenter.y);
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(topCenter.x, topCenter.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  private calculateTotalDuration(strokes: Stroke[]): number {
    return strokes.reduce((sum, s) => sum + this.getStrokeDuration(s), 0);
  }

  private getStrokeDuration(stroke: Stroke): number {
    if (stroke.points.length < 2) return 0;
    const first = stroke.points[0].timestamp;
    const last = stroke.points[stroke.points.length - 1].timestamp;
    return Math.max(0.1, (last - first) / 1000);
  }

  resize(width: number, height: number, scale: number = 1): void {
    this.width = width;
    this.height = height;
    this.scale = scale;

    const canvas = this.ctx.canvas;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(scale, scale);
  }

  getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.width * this.scale, this.height * this.scale);
  }

  toDataURL(type: string = 'image/png', quality: number = 0.92): string {
    return this.ctx.canvas.toDataURL(type, quality);
  }

  getCanvas(): HTMLCanvasElement {
    return this.ctx.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

export function createStrokePoint(x: number, y: number, pressure: number = 1): StrokePoint {
  return { x, y, pressure, timestamp: Date.now() };
}

export function createEmptyStroke(color: string, width: number, opacity: number = 1, isEraser: boolean = false): Stroke {
  return {
    id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    points: [],
    color,
    width,
    opacity,
    lineCap: 'round',
    lineJoin: 'round',
    isEraser
  };
}
