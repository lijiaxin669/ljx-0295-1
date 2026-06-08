import type { Stroke, Sticker, ProjectData, AnimationConfig } from '../../types/canvas';
import type { Sticker as StickerType } from '../../types/sticker';
import type { TextLayer } from '../../types/text';

const CURRENT_VERSION = '1.1';

export interface SerializedProject {
  version: string;
  template: string;
  canvas: {
    width: number;
    height: number;
  };
  strokes: Stroke[];
  stickers: StickerType[];
  textLayers: TextLayer[];
  animationConfig: AnimationConfig;
  createdAt: string;
  updatedAt: string;
}

export function serializeProject(
  template: string,
  canvasWidth: number,
  canvasHeight: number,
  strokes: Stroke[],
  stickers: StickerType[],
  textLayers: TextLayer[],
  animationConfig: AnimationConfig
): string {
  const project: SerializedProject = {
    version: CURRENT_VERSION,
    template,
    canvas: {
      width: canvasWidth,
      height: canvasHeight
    },
    strokes: strokes.map(s => ({
      id: s.id,
      points: s.points.map(p => ({
        x: Math.round(p.x * 100) / 100,
        y: Math.round(p.y * 100) / 100,
        pressure: Math.round(p.pressure * 100) / 100,
        timestamp: p.timestamp
      })),
      color: s.color,
      width: s.width,
      opacity: s.opacity,
      lineCap: s.lineCap,
      lineJoin: s.lineJoin
    })),
    stickers: stickers.map(s => ({
      id: s.id,
      type: s.type,
      src: s.src,
      name: s.name,
      x: Math.round(s.x * 100) / 100,
      y: Math.round(s.y * 100) / 100,
      scale: Math.round(s.scale * 100) / 100,
      rotation: Math.round(s.rotation * 10000) / 10000,
      opacity: Math.round(s.opacity * 100) / 100,
      zIndex: s.zIndex,
      flipX: s.flipX,
      flipY: s.flipY,
      width: s.width,
      height: s.height
    })),
    textLayers: textLayers.map(t => ({
      id: t.id,
      type: t.type,
      content: t.content,
      fontFamily: t.fontFamily,
      fontSize: t.fontSize,
      color: t.color,
      fontWeight: t.fontWeight,
      writingMode: t.writingMode,
      textAlign: t.textAlign,
      x: Math.round(t.x * 100) / 100,
      y: Math.round(t.y * 100) / 100,
      scale: Math.round(t.scale * 100) / 100,
      rotation: Math.round(t.rotation * 10000) / 10000,
      opacity: Math.round(t.opacity * 100) / 100,
      zIndex: t.zIndex,
      width: t.width,
      height: t.height,
      lineHeight: Math.round(t.lineHeight * 100) / 100,
      letterSpacing: Math.round(t.letterSpacing * 100) / 100,
      charAnimation: t.charAnimation,
      locked: t.locked,
      hidden: t.hidden
    })),
    animationConfig: {
      speed: Math.round(animationConfig.speed * 100) / 100,
      duration: animationConfig.duration,
      loop: animationConfig.loop
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return JSON.stringify(project, null, 2);
}

export function deserializeProject(jsonString: string): SerializedProject {
  try {
    const project = JSON.parse(jsonString) as SerializedProject;

    if (!project.version || !project.template || !project.canvas || !project.strokes || !project.stickers) {
      throw new Error('Invalid project file format');
    }

    if (!validateVersion(project.version)) {
      console.warn(`Project version ${project.version} may not be fully compatible`);
    }

    if (!project.textLayers) {
      project.textLayers = [];
      console.info('Legacy 1.0 project file - adding empty textLayers array');
    }

    return project;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

function validateVersion(version: string): boolean {
  const [major, minor] = version.split('.').map(Number);
  const [currentMajor, currentMinor] = CURRENT_VERSION.split('.').map(Number);

  if (major > currentMajor) return false;
  if (major === currentMajor && minor > currentMinor) return false;
  return true;
}

export function downloadProject(
  template: string,
  canvasWidth: number,
  canvasHeight: number,
  strokes: Stroke[],
  stickers: StickerType[],
  textLayers: TextLayer[],
  animationConfig: AnimationConfig,
  filename: string = 'new-year-card.json'
): void {
  const json = serializeProject(template, canvasWidth, canvasHeight, strokes, stickers, textLayers, animationConfig);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function loadProjectFromFile(file: File): Promise<SerializedProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project = deserializeProject(content);
        resolve(project);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function isValidProjectFile(file: File): boolean {
  return file.type === 'application/json' || file.name.endsWith('.json');
}

export function createSampleProject(): SerializedProject {
  return {
    version: CURRENT_VERSION,
    template: 'red-gold',
    canvas: { width: 1920, height: 1080 },
    strokes: [],
    stickers: [],
    textLayers: [],
    animationConfig: {
      speed: 1,
      duration: 15,
      loop: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function getProjectSummary(project: SerializedProject): {
  template: string;
  strokeCount: number;
  stickerCount: number;
  textLayerCount: number;
  duration: number;
  createdAt: string;
} {
  return {
    template: project.template,
    strokeCount: project.strokes.length,
    stickerCount: project.stickers.length,
    textLayerCount: (project.textLayers || []).length,
    duration: project.animationConfig.duration,
    createdAt: project.createdAt
  };
}
