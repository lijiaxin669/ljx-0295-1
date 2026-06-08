import { writable, derived, get } from 'svelte/store';
import type { Stroke, CanvasState } from '../types/canvas';

const MAX_HISTORY = 50;

const initialState: CanvasState = {
  width: 1920,
  height: 1080,
  scale: 1,
  strokes: [],
  currentStroke: null,
  history: [],
  redoStack: [],
  isDrawing: false
};

const createCanvasStore = () => {
  const { subscribe, set, update } = writable<CanvasState>(initialState);

  const saveHistory = () => {
    update(state => {
      const newHistory = [...state.history, [...state.strokes]];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return {
        ...state,
        history: newHistory,
        redoStack: []
      };
    });
  };

  return {
    subscribe,
    setDimensions: (width: number, height: number, scale: number = 1) =>
      update(state => ({ ...state, width, height, scale })),

    startStroke: (stroke: Stroke) => {
      saveHistory();
      update(state => ({
        ...state,
        currentStroke: stroke,
        isDrawing: true
      }));
    },

    updateCurrentStroke: (stroke: Stroke) =>
      update(state => ({
        ...state,
        currentStroke: stroke
      })),

    endStroke: () =>
      update(state => {
        if (!state.currentStroke) return state;
        return {
          ...state,
          strokes: [...state.strokes, state.currentStroke],
          currentStroke: null,
          isDrawing: false
        };
      }),

    addStroke: (stroke: Stroke) => {
      saveHistory();
      update(state => ({
        ...state,
        strokes: [...state.strokes, stroke]
      }));
    },

    undo: () =>
      update(state => {
        if (state.history.length === 0) return state;
        const newHistory = [...state.history];
        const previousStrokes = newHistory.pop()!;
        return {
          ...state,
          redoStack: [state.strokes, ...state.redoStack],
          strokes: previousStrokes,
          history: newHistory
        };
      }),

    redo: () =>
      update(state => {
        if (state.redoStack.length === 0) return state;
        const [nextStrokes, ...restRedo] = state.redoStack;
        return {
          ...state,
          history: [...state.history, state.strokes],
          strokes: nextStrokes,
          redoStack: restRedo
        };
      }),

    clear: () => {
      saveHistory();
      update(state => ({
        ...state,
        strokes: [],
        currentStroke: null
      }));
    },

    setStrokes: (strokes: Stroke[]) => {
      saveHistory();
      update(state => ({ ...state, strokes }));
    },

    reset: () => set(initialState),

    canUndo: derived({ subscribe }, state => state.history.length > 0),
    canRedo: derived({ subscribe }, state => state.redoStack.length > 0)
  };
};

export const canvas = createCanvasStore();

export const allStrokes = derived(
  canvas,
  $canvas => [...$canvas.strokes, ...($canvas.currentStroke ? [$canvas.currentStroke] : [])]
);

export const hasContent = derived(canvas, $canvas => $canvas.strokes.length > 0);

export const getCurrentStrokes = () => get(canvas).strokes;
