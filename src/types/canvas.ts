export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
  opacity: number;
  lineCap: 'round' | 'square';
  lineJoin: 'round' | 'bevel' | 'miter';
}

export interface BrushConfig {
  color: string;
  width: number;
  opacity: number;
  lineCap: 'round' | 'square';
  lineJoin: 'round' | 'bevel' | 'miter';
}

export interface CanvasState {
  width: number;
  height: number;
  scale: number;
  strokes: Stroke[];
  currentStroke: Stroke | null;
  history: Stroke[][];
  redoStack: Stroke[][];
  isDrawing: boolean;
}

export type ToolType = 'brush' | 'eraser' | 'text' | 'select';

export interface Template {
  id: string;
  name: 'red-gold' | 'minimal';
  displayName: string;
  background: string;
  borderStyle: string;
  decorations: TemplateDecoration[];
  defaultBrushColor: string;
  fontFamily: string;
}

export interface TemplateDecoration {
  type: 'pattern' | 'image' | 'shape';
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  opacity: number;
}

export interface AnimationConfig {
  speed: number;
  duration: number;
  loop: boolean;
}

export interface ProjectData {
  version: string;
  template: string;
  canvas: {
    width: number;
    height: number;
  };
  strokes: Stroke[];
  stickers: any[];
  animationConfig: AnimationConfig;
  createdAt: string;
  updatedAt: string;
}
