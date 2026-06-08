<script lang="ts">
  import { onDestroy } from 'svelte';
  import { animation, playbackState } from '../../stores/animationStore';
  import { canvas as canvasStore } from '../../stores/canvasStore';

  export let width = 640;
  export let height = 360;

  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationFrame: number;

  $: strokes = $canvasStore.strokes;
  $: template = $animation;
  $: playback = $playbackState;
  $: isPlaying = playback.isPlaying;
  $: progress = playback.progress;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    animation.play();
  };

  const handlePause = () => {
    animation.pause();
  };

  const handleStop = () => {
    animation.stop();
  };

  const handleSeek = (e: Event) => {
    const target = e.target as HTMLInputElement;
    animation.seek(parseFloat(target.value));
  };

  const handleSpeedChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    animation.setSpeed(parseFloat(target.value));
  };

  const handleLoopToggle = () => {
    animation.setLoop(!template.loop);
  };

  const drawFrame = () => {
    if (!ctx || !canvasElement) return;

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (strokes.length === 0) {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
      ctx.fillStyle = '#999';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无笔迹，请先在画布上书写', canvasElement.width / 2, canvasElement.height / 2);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvasElement.width / 1920;
    const scaleY = canvasElement.height / 1080;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvasElement.width - 1920 * scale) / 2;
    const offsetY = (canvasElement.height - 1080 * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const totalDuration = 15 * 1000;
    const currentTime = progress * totalDuration;

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      const firstPoint = stroke.points[0];
      const lastPoint = stroke.points[stroke.points.length - 1];
      const strokeStart = firstPoint.timestamp;
      const strokeEnd = lastPoint.timestamp;

      if (currentTime < strokeStart) continue;

      let visibleProgress = 1;
      if (currentTime < strokeEnd) {
        visibleProgress = (currentTime - strokeStart) / (strokeEnd - strokeStart);
      }

      const visibleCount = Math.max(2, Math.floor(stroke.points.length * visibleProgress));
      const visiblePoints = stroke.points.slice(0, visibleCount);

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);

      for (let i = 1; i < visiblePoints.length; i++) {
        const p0 = visiblePoints[i - 2] || visiblePoints[0];
        const p1 = visiblePoints[i - 1];
        const p2 = visiblePoints[i];
        const p3 = visiblePoints[i + 1] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }

      ctx.stroke();
    }

    ctx.restore();
  };

  const animate = () => {
    drawFrame();
    animationFrame = requestAnimationFrame(animate);
  };

  const initCanvas = () => {
    if (!canvasElement) return;
    const dpr = window.devicePixelRatio || 1;
    canvasElement.width = width * dpr;
    canvasElement.height = height * dpr;
    ctx = canvasElement.getContext('2d')!;
    ctx.scale(dpr, dpr);
    drawFrame();
  };

  $: if (canvasElement) {
    initCanvas();
  }

  $: {
    if (isPlaying) {
      cancelAnimationFrame(animationFrame);
      animate();
    } else {
      cancelAnimationFrame(animationFrame);
      drawFrame();
    }
  }

  onDestroy(() => {
    cancelAnimationFrame(animationFrame);
  });
</script>

<div class="animation-player">
  <div class="preview-container">
    <canvas
      bind:this={canvasElement}
      class="preview-canvas"
      style={`width: ${width}px; height: ${height}px;`}
    />
    {#if isPlaying}
      <div class="playing-indicator">
        <span class="indicator-dot"></span>
        播放中
      </div>
    {/if}
  </div>

  <div class="player-controls">
    <div class="progress-section">
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={progress}
        on:input={handleSeek}
        class="progress-slider"
      />
      <div class="time-display">
        <span>{formatTime(progress * 15)}</span>
        <span>/</span>
        <span>{formatTime(15)}</span>
      </div>
    </div>

    <div class="control-buttons">
      <button class="control-btn" on:click={handleStop} title="停止">
        <span class="btn-icon">⏹️</span>
      </button>

      {#if isPlaying}
        <button class="control-btn play-btn" on:click={handlePause} title="暂停">
          <span class="btn-icon">⏸️</span>
        </button>
      {:else}
        <button class="control-btn play-btn" on:click={handlePlay} title="播放">
          <span class="btn-icon">▶️</span>
        </button>
      {/if}

      <button
        class="control-btn loop-btn {template.loop ? 'active' : ''}"
        on:click={handleLoopToggle}
        title="循环播放"
      >
        <span class="btn-icon">🔁</span>
      </button>
    </div>

    <div class="speed-control">
      <label for="speed-select" class="speed-label">速度</label>
      <select id="speed-select" value={template.speed} on:change={handleSpeedChange} class="speed-select">
        <option value={0.5}>0.5x</option>
        <option value={0.75}>0.75x</option>
        <option value={1}>1x</option>
        <option value={1.25}>1.25x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>
    </div>
  </div>
</div>

<style lang="scss">
  .animation-player {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .preview-container {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    background: #000;
  }

  .preview-canvas {
    display: block;
    background: #fff;
  }

  .playing-indicator {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 12px;
    border-radius: 20px;

    .indicator-dot {
      width: 8px;
      height: 8px;
      background: #ff4444;
      border-radius: 50%;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  }

  .player-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .progress-slider {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    background: linear-gradient(to right, #C41E3A var(--progress, 0%), #e0e0e0 var(--progress, 0%));
    border-radius: 3px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: white;
      border: 3px solid #C41E3A;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .time-display {
    display: flex;
    justify-content: center;
    gap: 8px;
    font-family: monospace;
    font-size: 13px;
    color: #666;
  }

  .control-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e8e8e8;
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    &.play-btn {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #C41E3A, #D4AF37);
      color: white;

      &:hover {
        box-shadow: 0 4px 16px rgba(196, 30, 58, 0.4);
      }
    }

    &.loop-btn.active {
      background: rgba(196, 30, 58, 0.15);
      border: 2px solid #C41E3A;
    }

    .btn-icon {
      font-size: 18px;
    }
  }

  .speed-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .speed-label {
    font-size: 13px;
    color: #666;
  }

  .speed-select {
    padding: 6px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 13px;
    color: #333;
    background: white;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;

    &:hover,
    &:focus {
      border-color: #C41E3A;
    }
  }
</style>
