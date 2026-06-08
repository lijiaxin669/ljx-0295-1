import { writable, derived, get } from 'svelte/store';
import type { TextLayer, TextAlign, WritingMode } from '../types/text';
import type { ControlPointType } from '../types/sticker';
import { getFontById, getFontFamily, DEFAULT_FONT_ID } from '../data/fonts';

interface TextTransformState {
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  activeControl: ControlPointType | null;
  startX: number;
  startY: number;
  startText: TextLayer | null;
}

const createTextLayerStore = () => {
  const { subscribe, set, update } = writable<TextLayer[]>([]);
  const selectedId = writable<string | null>(null);
  const transform = writable<TextTransformState>({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    activeControl: null,
    startX: 0,
    startY: 0,
    startText: null
  });

  const calculateTextSize = (content: string, fontSize: number, writingMode: WritingMode, lineHeight: number): { width: number; height: number } => {
    const lines = content.split('\n');
    if (writingMode === 'horizontal') {
      const maxChars = Math.max(...lines.map(l => l.length));
      return {
        width: maxChars * fontSize,
        height: lines.length * fontSize * lineHeight
      };
    } else {
      const maxLines = Math.max(...lines.map(l => l.length));
      return {
        width: lines.length * fontSize * lineHeight,
        height: maxLines * fontSize
      };
    }
  };

  return {
    subscribe,
    selectedId,
    transform,

    addTextLayer: (
      content: string,
      x: number,
      y: number,
      options: Partial<TextLayer> = {}
    ) => {
      const fontId = options.fontFamily || DEFAULT_FONT_ID;
      const fontSize = options.fontSize || 48;
      const writingMode = options.writingMode || 'horizontal';
      const lineHeight = options.lineHeight || 1.5;
      const size = calculateTextSize(content, fontSize, writingMode, lineHeight);

      const newText: TextLayer = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        content,
        fontFamily: fontId,
        fontSize,
        color: options.color || '#D4AF37',
        fontWeight: options.fontWeight || 'normal',
        writingMode,
        textAlign: options.textAlign || 'center',
        x,
        y,
        scale: options.scale || 1,
        rotation: options.rotation || 0,
        opacity: options.opacity || 1,
        zIndex: Date.now(),
        width: size.width,
        height: size.height,
        lineHeight,
        letterSpacing: options.letterSpacing || 0,
        charAnimation: options.charAnimation !== false,
        locked: false,
        hidden: false
      };

      update(texts => [...texts, newText]);
      selectedId.set(newText.id);
      return newText;
    },

    selectTextLayer: (id: string | null) => selectedId.set(id),

    updateTextLayer: (id: string, updates: Partial<TextLayer>) =>
      update(texts =>
        texts.map(t => {
          if (t.id !== id) return t;
          const updated = { ...t, ...updates };
          if (updates.content || updates.fontSize || updates.writingMode || updates.lineHeight) {
            const size = calculateTextSize(
              updated.content,
              updated.fontSize,
              updated.writingMode,
              updated.lineHeight
            );
            updated.width = size.width;
            updated.height = size.height;
          }
          return updated;
        })
      ),

    deleteTextLayer: (id: string) => {
      update(texts => texts.filter(t => t.id !== id));
      if (get(selectedId) === id) {
        selectedId.set(null);
      }
    },

    duplicateTextLayer: (id: string) => {
      const text = get({ subscribe }).find(t => t.id === id);
      if (!text) return;

      const newText: TextLayer = {
        ...text,
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: text.x + 20,
        y: text.y + 20,
        zIndex: Date.now()
      };

      update(texts => [...texts, newText]);
      selectedId.set(newText.id);
    },

    bringToFront: (id: string) =>
      update(texts => {
        const maxZ = Math.max(...texts.map(t => t.zIndex));
        return texts.map(t =>
          t.id === id ? { ...t, zIndex: maxZ + 1 } : t
        );
      }),

    sendToBack: (id: string) =>
      update(texts => {
        const minZ = Math.min(...texts.map(t => t.zIndex));
        return texts.map(t =>
          t.id === id ? { ...t, zIndex: minZ - 1 } : t
        );
      }),

    bringForward: (id: string) =>
      update(texts => {
        const sorted = [...texts].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex(t => t.id === id);
        if (idx === -1 || idx === sorted.length - 1) return texts;

        const next = sorted[idx + 1];
        return texts.map(t => {
          if (t.id === id) return { ...t, zIndex: next.zIndex + 1 };
          return t;
        });
      }),

    sendBackward: (id: string) =>
      update(texts => {
        const sorted = [...texts].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex(t => t.id === id);
        if (idx <= 0) return texts;

        const prev = sorted[idx - 1];
        return texts.map(t => {
          if (t.id === id) return { ...t, zIndex: prev.zIndex - 1 };
          return t;
        });
      }),

    toggleLock: (id: string) =>
      update(texts =>
        texts.map(t => (t.id === id ? { ...t, locked: !t.locked } : t))
      ),

    toggleVisibility: (id: string) =>
      update(texts =>
        texts.map(t => (t.id === id ? { ...t, hidden: !t.hidden } : t))
      ),

    startTransform: (x: number, y: number, control?: ControlPointType) => {
      const selId = get(selectedId);
      if (!selId) return;

      const text = get({ subscribe }).find(t => t.id === selId);
      if (!text || text.locked) return;

      transform.set({
        isDragging: !control,
        isResizing: control && control !== 'rotate',
        isRotating: control === 'rotate',
        activeControl: control || null,
        startX: x,
        startY: y,
        startText: { ...text }
      });
    },

    endTransform: () =>
      transform.set({
        isDragging: false,
        isResizing: false,
        isRotating: false,
        activeControl: null,
        startX: 0,
        startY: 0,
        startText: null
      }),

    setTextLayers: (newTexts: TextLayer[]) => set(newTexts),

    clear: () => {
      set([]);
      selectedId.set(null);
    },

    clearTextLayers: () => {
      set([]);
      selectedId.set(null);
    },

    reset: () => {
      set([]);
      selectedId.set(null);
    }
  };
};

export const textLayers = createTextLayerStore();

export const selectedTextLayer = derived(
  [textLayers, textLayers.selectedId],
  ([$textLayers, $selectedId]) => $textLayers.find(t => t.id === $selectedId) || null
);

export const sortedTextLayers = derived(textLayers, $textLayers =>
  [...$textLayers].sort((a, b) => a.zIndex - b.zIndex)
);

export const hasTextLayers = derived(textLayers, $textLayers => $textLayers.length > 0);

export function getTextAlignOffset(
  align: TextAlign,
  width: number,
  height: number
): { x: number; y: number } {
  switch (align) {
    case 'top-left':
      return { x: 0, y: 0 };
    case 'top-center':
      return { x: -width / 2, y: 0 };
    case 'top-right':
      return { x: -width, y: 0 };
    case 'middle-left':
      return { x: 0, y: -height / 2 };
    case 'center':
      return { x: -width / 2, y: -height / 2 };
    case 'middle-right':
      return { x: -width, y: -height / 2 };
    case 'bottom-left':
      return { x: 0, y: -height };
    case 'bottom-center':
      return { x: -width / 2, y: -height };
    case 'bottom-right':
      return { x: -width, y: -height };
    default:
      return { x: -width / 2, y: -height / 2 };
  }
}
