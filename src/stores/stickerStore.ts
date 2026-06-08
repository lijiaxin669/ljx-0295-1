import { writable, derived, get } from 'svelte/store';
import type { Sticker, TransformState, ControlPointType } from '../types/sticker';
import { getStickerById } from '../data/stickers';

const createStickerStore = () => {
  const { subscribe, set, update } = writable<Sticker[]>([]);
  const selectedId = writable<string | null>(null);
  const transform = writable<TransformState>({
    isDragging: false,
    isResizing: false,
    isRotating: false,
    activeControl: null,
    startX: 0,
    startY: 0,
    startSticker: null
  });

  return {
    subscribe,
    selectedId,
    transform,

    addSticker: (itemId: string, x: number, y: number) => {
      const item = getStickerById(itemId);
      if (!item) return;

      const newSticker: Sticker = {
        id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: item.type,
        src: item.src,
        name: item.name,
        x,
        y,
        scale: 1,
        rotation: 0,
        opacity: 1,
        zIndex: Date.now(),
        flipX: false,
        flipY: false,
        width: item.defaultWidth,
        height: item.defaultHeight
      };

      update(stickers => [...stickers, newSticker]);
      selectedId.set(newSticker.id);
    },

    selectSticker: (id: string | null) => selectedId.set(id),

    updateSticker: (id: string, updates: Partial<Sticker>) =>
      update(stickers =>
        stickers.map(s => (s.id === id ? { ...s, ...updates } : s))
      ),

    deleteSticker: (id: string) => {
      update(stickers => stickers.filter(s => s.id !== id));
      if (get(selectedId) === id) {
        selectedId.set(null);
      }
    },

    duplicateSticker: (id: string) => {
      const sticker = get({ subscribe }).find(s => s.id === id);
      if (!sticker) return;

      const newSticker: Sticker = {
        ...sticker,
        id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: sticker.x + 20,
        y: sticker.y + 20,
        zIndex: Date.now()
      };

      update(stickers => [...stickers, newSticker]);
      selectedId.set(newSticker.id);
    },

    bringForward: (id: string) =>
      update(stickers => {
        const idx = stickers.findIndex(s => s.id === id);
        if (idx === -1 || idx === stickers.length - 1) return stickers;
        const newStickers = [...stickers];
        [newStickers[idx], newStickers[idx + 1]] = [newStickers[idx + 1], newStickers[idx]];
        return newStickers;
      }),

    sendBackward: (id: string) =>
      update(stickers => {
        const idx = stickers.findIndex(s => s.id === id);
        if (idx <= 0) return stickers;
        const newStickers = [...stickers];
        [newStickers[idx], newStickers[idx - 1]] = [newStickers[idx - 1], newStickers[idx]];
        return newStickers;
      }),

    startTransform: (x: number, y: number, control?: ControlPointType) => {
      const selId = get(selectedId);
      if (!selId) return;

      const sticker = get({ subscribe }).find(s => s.id === selId);
      if (!sticker) return;

      transform.set({
        isDragging: !control,
        isResizing: control && control !== 'rotate',
        isRotating: control === 'rotate',
        activeControl: control || null,
        startX: x,
        startY: y,
        startSticker: { ...sticker }
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
        startSticker: null
      }),

    setStickers: (newStickers: Sticker[]) => set(newStickers),

    clear: () => {
      set([]);
      selectedId.set(null);
    },

    reset: () => {
      set([]);
      selectedId.set(null);
    }
  };
};

export const stickers = createStickerStore();

export const selectedSticker = derived(
  [stickers, stickers.selectedId],
  ([$stickers, $selectedId]) => $stickers.find(s => s.id === $selectedId) || null
);

export const sortedStickers = derived(stickers, $stickers =>
  [...$stickers].sort((a, b) => a.zIndex - b.zIndex)
);

export const hasStickers = derived(stickers, $stickers => $stickers.length > 0);
