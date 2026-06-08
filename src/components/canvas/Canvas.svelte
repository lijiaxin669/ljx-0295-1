<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte';
  import { get } from 'svelte/store';
  import { canvas as canvasStore, allStrokes } from '../../stores/canvasStore';
  import { brushConfig, currentTool } from '../../stores/brushStore';
  import { templateId, currentTemplate } from '../../stores/templateStore';
  import { stickers, sortedStickers, selectedSticker } from '../../stores/stickerStore';
  import { animation, animationConfig } from '../../stores/animationStore';
  import { CanvasRenderer, createStrokePoint, createEmptyStroke } from '../../utils/canvas/renderer';
  import { StrokeAnimationPlayer, preprocessStrokesForAnimation } from '../../utils/canvas/animation';
  import { getStickerTransformMatrix, getTransformedCorners, pointInPolygon, clamp, angle, distance } from '../../utils/math';
  import type { Stroke, StrokePoint } from '../../types/canvas';
  import type { Sticker, ControlPointType } from '../../types/sticker';

  let canvasElement: HTMLCanvasElement;
  let renderer: CanvasRenderer;
  let animationPlayer: StrokeAnimationPlayer | null = null;
  let animationCanvas: HTMLCanvasElement | null = null;
  let animationRenderer: CanvasRenderer | null = null;

  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;
  let displayWidth = 960;
  let displayHeight = 540;
  let scale = 1;

  const stickerImages = new Map<string, HTMLImageElement>();
  let isAnimating = false;
  let animationProgress = 0;

  const loadStickerImage = async (stickerId: string, src: string) => {
    if (stickerImages.has(stickerId)) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    try {
      await img.decode();
      stickerImages.set(stickerId, img);
    } catch (e) {
      console.warn('Failed to load sticker image:', src, e);
    }
  };

  const preloadStickerImages = () => {
    const stickerList = get(sortedStickers);
    stickerList.forEach(sticker => {
      if (!stickerImages.has(sticker.id)) {
        loadStickerImage(sticker.id, sticker.src);
      }
    });
  };

  const setCanvasSize = () => {
    const container = canvasElement.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

    if (containerWidth / containerHeight > aspectRatio) {
      displayHeight = Math.min(containerHeight, CANVAS_HEIGHT);
      displayWidth = displayHeight * aspectRatio;
    } else {
      displayWidth = Math.min(containerWidth, CANVAS_WIDTH);
      displayHeight = displayWidth / aspectRatio;
    }

    scale = window.devicePixelRatio || 1;

    if (renderer) {
      renderer.resize(displayWidth, displayHeight, scale);
    }
  };

  const getCanvasCoords = (e: MouseEvent | Touch): { x: number; y: number } => {
    const rect = canvasElement.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  let isDrawing = false;
  let currentStroke: Stroke | null = null;

  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    if (isAnimating) return;
    e.preventDefault();

    const coords = getCanvasCoords(e as MouseEvent);
    const tool = get(currentTool);

    if (tool === 'select' || tool === 'eraser') {
      const hitSticker = findStickerAtPoint(coords.x, coords.y);
      if (hitSticker) {
        if (tool === 'eraser') {
          stickers.deleteSticker(hitSticker.id);
        } else {
          const controlHit = findControlPointAtPoint(coords.x, coords.y, hitSticker);
          if (controlHit) {
            stickers.startTransform(coords.x, coords.y, controlHit);
          } else {
            stickers.selectSticker(hitSticker.id);
            stickers.startTransform(coords.x, coords.y);
          }
        }
        return;
      } else if (tool === 'select') {
        stickers.selectSticker(null);
      }
    }

    if (tool === 'brush' || tool === 'eraser') {
      const brush = get(brushConfig);
      const template = get(templateId);

      isDrawing = true;
      currentStroke = createEmptyStroke(
        tool === 'eraser' ? getEraserColor() : brush.color,
        tool === 'eraser' ? brush.width * 2 : brush.width,
        tool === 'eraser' ? 1 : brush.opacity
      );

      const point = createStrokePoint(coords.x, coords.y);
      currentStroke.points.push(point);
      canvasStore.startStroke(currentStroke);
    }
  };

  const getEraserColor = (): string => {
    const tid = get(templateId);
    return tid === 'red-gold' ? '#C41E3A' : '#FAFAFA';
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();

    const coords = getCanvasCoords(e as MouseEvent);
    const transform = get(stickers.transform);

    if (transform.isDragging || transform.isResizing || transform.isRotating) {
      handleStickerTransform(coords.x, coords.y);
      return;
    }

    if (isDrawing && currentStroke) {
      const point = createStrokePoint(coords.x, coords.y);
      const lastPoint = currentStroke.points[currentStroke.points.length - 1];

      const dist = Math.sqrt(
        (point.x - lastPoint.x) ** 2 + (point.y - lastPoint.y) ** 2
      );

      if (dist > 2) {
        currentStroke.points.push(point);
        canvasStore.updateCurrentStroke(currentStroke);
      }
    }
  };

  const handlePointerUp = () => {
    const transform = get(stickers.transform);
    if (transform.isDragging || transform.isResizing || transform.isRotating) {
      stickers.endTransform();
      return;
    }

    if (isDrawing) {
      isDrawing = false;
      currentStroke = null;
      canvasStore.endStroke();
    }
  };

  const findStickerAtPoint = (x: number, y: number): Sticker | null => {
    const allStickers = get(stickers);
    for (let i = allStickers.length - 1; i >= 0; i--) {
      const sticker = allStickers[i];
      const matrix = getStickerTransformMatrix(
        sticker.x, sticker.y, sticker.rotation, sticker.scale,
        sticker.flipX, sticker.flipY
      );
      const corners = getTransformedCorners(sticker.width, sticker.height, matrix);

      if (pointInPolygon({ x, y }, corners)) {
        return sticker;
      }
    }
    return null;
  };

  const findControlPointAtPoint = (x: number, y: number, sticker: Sticker): ControlPointType | null => {
    const matrix = getStickerTransformMatrix(
      sticker.x, sticker.y, sticker.rotation, sticker.scale,
      sticker.flipX, sticker.flipY
    );
    const corners = getTransformedCorners(sticker.width, sticker.height, matrix);

    const controlPoints: { type: ControlPointType; x: number; y: number }[] = [
      { type: 'top-left', x: corners[0].x, y: corners[0].y },
      { type: 'top-center', x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 },
      { type: 'top-right', x: corners[1].x, y: corners[1].y },
      { type: 'middle-left', x: corners[0].x, y: (corners[0].y + corners[3].y) / 2 },
      { type: 'middle-right', x: corners[1].x, y: (corners[1].y + corners[2].y) / 2 },
      { type: 'bottom-left', x: corners[3].x, y: corners[3].y },
      { type: 'bottom-center', x: (corners[3].x + corners[2].x) / 2, y: (corners[3].y + corners[2].y) / 2 },
      { type: 'bottom-right', x: corners[2].x, y: corners[2].y },
      { type: 'rotate', x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 - 30 }
    ];

    for (const cp of controlPoints) {
      if (Math.sqrt((x - cp.x) ** 2 + (y - cp.y) ** 2) < 15) {
        return cp.type;
      }
    }
    return null;
  };

  const handleStickerTransform = (x: number, y: number) => {
    const transform = get(stickers.transform);
    const selected = get(selectedSticker);
    if (!transform.startSticker || !selected) return;

    const deltaX = x - transform.startX;
    const deltaY = y - transform.startY;
    const start = transform.startSticker;

    if (transform.isDragging) {
      stickers.updateSticker(selected.id, {
        x: start.x + deltaX * (CANVAS_WIDTH / displayWidth),
        y: start.y + deltaY * (CANVAS_HEIGHT / displayHeight)
      });
    } else if (transform.isResizing && transform.activeControl) {
      handleResize(selected, start, deltaX, deltaY, transform.activeControl);
    } else if (transform.isRotating) {
      const currentAngle = angle({ x: start.x, y: start.y }, { x, y });
      const startAngle = angle({ x: start.x, y: start.y }, { x: transform.startX, y: transform.startY });
      stickers.updateSticker(selected.id, {
        rotation: start.rotation + (currentAngle - startAngle)
      });
    }
  };

  const handleResize = (
    sticker: Sticker,
    start: Sticker,
    deltaX: number,
    deltaY: number,
    control: ControlPointType
  ) => {
    const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    const sign = control.includes('left') || control.includes('top') ? -1 : 1;
    const scaleFactor = 1 + (sign * delta) / 200;
    const newScale = clamp(start.scale * scaleFactor, 0.2, 5);

    stickers.updateSticker(sticker.id, { scale: newScale });
  };

  const render = () => {
    if (!renderer) return;

    const template = get(currentTemplate);
    const strokes = get(allStrokes);
    const stickerList = get(sortedStickers);
    const selected = get(selectedSticker);
    const animConfig = get(animationConfig);
    const targetStrokes = preprocessStrokesForAnimation(strokes, animConfig.duration);

    renderer.clear();
    renderer.drawBackground(template);

    if (isAnimating) {
      renderer.drawStrokes(targetStrokes, animationProgress);
    } else {
      strokes.forEach(stroke => renderer.drawStroke(stroke, 1));
    }

    preloadStickerImages();
    stickerList.forEach(sticker => {
      const img = stickerImages.get(sticker.id);
      if (img && img.complete) {
        renderer.drawSticker(sticker, img, selected?.id === sticker.id && !isAnimating);
      }
    });
  };

  let rafId: number;
  const renderLoop = () => {
    render();
    rafId = requestAnimationFrame(renderLoop);
  };

  const playAnimation = () => {
    if (animationPlayer) {
      animationPlayer.destroy();
    }

    const strokes = get(allStrokes);
    const animConfig = get(animationConfig);

    if (strokes.length === 0) return;

    const processedStrokes = preprocessStrokesForAnimation(strokes, animConfig.duration);
    animationPlayer = new StrokeAnimationPlayer(processedStrokes, animConfig.duration);
    animationPlayer.setSpeed(animConfig.speed);
    animationPlayer.setLoop(animConfig.loop);

    animationPlayer.setOnProgress(progress => {
      animationProgress = progress;
      animation.seek(progress);
    });

    animationPlayer.setOnComplete(() => {
      if (!animConfig.loop) {
        isAnimating = false;
        animation.pause();
      }
    });

    isAnimating = true;
    animation.play();
    animationPlayer.play();
  };

  const stopAnimation = () => {
    if (animationPlayer) {
      animationPlayer.stop();
      animationPlayer.destroy();
      animationPlayer = null;
    }
    isAnimating = false;
    animationProgress = 0;
    animation.stop();
  };

  const pauseAnimation = () => {
    if (animationPlayer) {
      animationPlayer.pause();
    }
    isAnimating = false;
    animation.pause();
  };

  const resumeAnimation = () => {
    if (animationPlayer) {
      animationPlayer.resume();
    }
    isAnimating = true;
    animation.play();
  };

  const seekAnimation = (progress: number) => {
    animationProgress = progress;
    animation.seek(progress);
    if (animationPlayer) {
      animationPlayer.seek(progress);
    }
  };

  const getAnimationCanvas = (): HTMLCanvasElement => {
    if (!animationCanvas) {
      animationCanvas = document.createElement('canvas');
      animationRenderer = new CanvasRenderer(animationCanvas, CANVAS_WIDTH, CANVAS_HEIGHT, 1);
    }
    return animationCanvas;
  };

  const renderAnimationFrame = (progress: number) => {
    if (!animationRenderer) return;

    const template = get(currentTemplate);
    const strokes = get(allStrokes);
    const stickerList = get(sortedStickers);
    const animConfig = get(animationConfig);
    const processedStrokes = preprocessStrokesForAnimation(strokes, animConfig.duration);

    animationRenderer.clear();
    animationRenderer.drawBackground(template);
    animationRenderer.drawStrokes(processedStrokes, progress);

    stickerList.forEach(sticker => {
      const img = stickerImages.get(sticker.id);
      if (img && img.complete) {
        animationRenderer!.drawSticker(sticker, img, false);
      }
    });
  };

  setContext('canvas', {
    playAnimation,
    stopAnimation,
    pauseAnimation,
    resumeAnimation,
    seekAnimation,
    getAnimationCanvas,
    renderAnimationFrame,
    isAnimating: () => isAnimating
  });

  onMount(() => {
    scale = window.devicePixelRatio || 1;
    renderer = new CanvasRenderer(canvasElement, displayWidth, displayHeight, scale);
    setCanvasSize();
    renderLoop();

    window.addEventListener('resize', setCanvasSize);

    canvasElement.addEventListener('mousedown', handlePointerDown);
    canvasElement.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvasElement.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvasElement.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  });

  onDestroy(() => {
    cancelAnimationFrame(rafId);
    if (animationPlayer) {
      animationPlayer.destroy();
      animationPlayer = null;
    }
    window.removeEventListener('resize', setCanvasSize);
    window.removeEventListener('mouseup', handlePointerUp);
    window.removeEventListener('touchend', handlePointerUp);
    if (canvasElement) {
      canvasElement.removeEventListener('mousedown', handlePointerDown);
      canvasElement.removeEventListener('mousemove', handlePointerMove);
      canvasElement.removeEventListener('touchstart', handlePointerDown);
      canvasElement.removeEventListener('touchmove', handlePointerMove);
    }
    stickerImages.clear();
  });
</script>

<div class="canvas-wrapper">
  <canvas
    bind:this={canvasElement}
    class="canvas"
    style={`width: ${displayWidth}px; height: ${displayHeight}px;`}
  />
</div>

<style lang="scss">
  .canvas-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .canvas {
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    touch-action: none;
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
    }
  }
</style>
