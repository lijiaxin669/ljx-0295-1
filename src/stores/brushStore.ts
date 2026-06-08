import { writable, derived } from 'svelte/store';
import type { BrushConfig, ToolType } from '../types/canvas';
import { templateId } from './templateStore';
import { getTemplateById } from '../data/templates';

const defaultBrush: BrushConfig = {
  color: '#D4AF37',
  width: 8,
  opacity: 1,
  lineCap: 'round',
  lineJoin: 'round'
};

const createBrushStore = () => {
  const { subscribe, set, update } = writable<BrushConfig>(defaultBrush);
  const tool = writable<ToolType>('brush');

  return {
    subscribe,
    tool,
    setColor: (color: string) => update(b => ({ ...b, color })),
    setWidth: (width: number) => update(b => ({ ...b, width })),
    setOpacity: (opacity: number) => update(b => ({ ...b, opacity })),
    setLineCap: (lineCap: 'round' | 'square') => update(b => ({ ...b, lineCap })),
    setLineJoin: (lineJoin: 'round' | 'bevel' | 'miter') => update(b => ({ ...b, lineJoin })),
    setTool: (t: ToolType) => tool.set(t),
    reset: () => set(defaultBrush)
  };
};

export const brush = createBrushStore();

export const brushConfig = derived(
  [brush, templateId],
  ([$brush, $templateId]) => {
    if ($brush.color === defaultBrush.color) {
      const template = getTemplateById($templateId);
      return { ...$brush, color: template.defaultBrushColor };
    }
    return $brush;
  }
);

export const currentTool = brush.tool;

export const COLOR_PRESETS = [
  '#D4AF37', '#FFD700', '#FF6B6B', '#C41E3A', '#8B0000',
  '#333333', '#FFFFFF', '#228B22', '#FF8C42', '#9B59B6',
  '#3498DB', '#1ABC9C'
];

export const WIDTH_PRESETS = [2, 4, 6, 8, 12, 16, 24, 32];
