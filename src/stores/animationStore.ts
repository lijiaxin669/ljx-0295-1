import { writable, derived } from 'svelte/store';
import type { AnimationConfig } from '../types/canvas';

const defaultConfig: AnimationConfig = {
  speed: 1,
  duration: 15,
  loop: false
};

const createAnimationStore = () => {
  const { subscribe, set, update } = writable<AnimationConfig>(defaultConfig);
  const isPlaying = writable(false);
  const currentProgress = writable(0);

  return {
    subscribe,
    isPlaying,
    currentProgress,

    setSpeed: (speed: number) => update(c => ({ ...c, speed })),
    setDuration: (duration: number) => update(c => ({ ...c, duration })),
    setLoop: (loop: boolean) => update(c => ({ ...c, loop })),
    setConfig: (config: Partial<AnimationConfig>) => update(c => ({ ...c, ...config })),

    play: () => isPlaying.set(true),
    pause: () => isPlaying.set(false),
    stop: () => {
      isPlaying.set(false);
      currentProgress.set(0);
    },
    seek: (progress: number) => currentProgress.set(Math.max(0, Math.min(1, progress))),

    reset: () => {
      set(defaultConfig);
      isPlaying.set(false);
      currentProgress.set(0);
    }
  };
};

export const animation = createAnimationStore();

export const animationConfig = derived(animation, $a => $a);

export const playbackState = derived(
  [animation.isPlaying, animation.currentProgress],
  ([$isPlaying, $progress]) => ({
    isPlaying: $isPlaying,
    progress: $progress,
    currentTime: $progress * 15
  })
);
