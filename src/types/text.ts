export type WritingMode = 'horizontal' | 'vertical';

export type TextAlign =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface FontConfig {
  id: string;
  name: string;
  fontFamily: string;
  category: 'calligraphy' | 'regular' | 'handwriting';
  fallback: string;
}

export interface TextLayer {
  id: string;
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  writingMode: WritingMode;
  textAlign: TextAlign;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  width: number;
  height: number;
  lineHeight: number;
  letterSpacing: number;
  charAnimation: boolean;
  locked: boolean;
  hidden: boolean;
}

export type LayerType = 'stroke' | 'text' | 'sticker';

export interface LayerItem {
  id: string;
  type: LayerType;
  name: string;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
  data: any;
}
