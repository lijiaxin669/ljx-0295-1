import { writable } from 'svelte/store';

export interface FrameRenderer {
  renderAnimationFrame: (progress: number) => void;
  getAnimationCanvas: () => HTMLCanvasElement | null;
  playAnimation: () => void;
  stopAnimation: () => void;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  seekAnimation: (progress: number) => void;
  isAnimating: () => boolean;
}

const createRendererStore = () => {
  const { subscribe, set } = writable<FrameRenderer | null>(null);

  let renderer: FrameRenderer | null = null;

  return {
    subscribe,
    setRenderer: (r: FrameRenderer) => {
      renderer = r;
      set(r);
    },
    clearRenderer: () => {
      renderer = null;
      set(null);
    },
    renderAnimationFrame: (progress: number) => {
      if (renderer) {
        renderer.renderAnimationFrame(progress);
      }
    },
    getAnimationCanvas: () => {
      return renderer ? renderer.getAnimationCanvas() : null;
    },
    playAnimation: () => {
      if (renderer) {
        renderer.playAnimation();
      }
    },
    stopAnimation: () => {
      if (renderer) {
        renderer.stopAnimation();
      }
    },
    pauseAnimation: () => {
      if (renderer) {
        renderer.pauseAnimation();
      }
    },
    resumeAnimation: () => {
      if (renderer) {
        renderer.resumeAnimation();
      }
    },
    seekAnimation: (progress: number) => {
      if (renderer) {
        renderer.seekAnimation(progress);
      }
    },
    isAnimating: () => {
      return renderer ? renderer.isAnimating() : false;
    }
  };
};

export const rendererService = createRendererStore();
