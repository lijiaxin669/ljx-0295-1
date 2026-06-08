export type StickerType = 'lantern' | 'fu' | 'zodiac' | 'decoration' | 'text';

export interface Sticker {
  id: string;
  type: StickerType;
  src: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  flipX: boolean;
  flipY: boolean;
  width: number;
  height: number;
}

export interface StickerCategory {
  id: string;
  name: string;
  items: StickerItem[];
}

export interface StickerItem {
  id: string;
  name: string;
  src: string;
  type: StickerType;
  defaultWidth: number;
  defaultHeight: number;
}

export type ControlPointType =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'rotate';

export interface ControlPoint {
  type: ControlPointType;
  x: number;
  y: number;
}

export interface TransformState {
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  activeControl: ControlPointType | null;
  startX: number;
  startY: number;
  startSticker: Sticker | null;
}
