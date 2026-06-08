<script lang="ts">
  export let percent: number = 0;
  export let status: string = 'idle';
  export let currentFrame: number = 0;
  export let totalFrames: number = 0;
  export let showDetails: boolean = true;

  const statusText: Record<string, string> = {
    idle: '等待开始',
    preparing: '准备中...',
    rendering: '渲染帧...',
    encoding: '编码中...',
    completed: '完成！',
    error: '出错了'
  };

  const statusColor: Record<string, string> = {
    idle: '#e0e0e0',
    preparing: '#D4AF37',
    rendering: '#C41E3A',
    encoding: '#2196F3',
    completed: '#4CAF50',
    error: '#F44336'
  };

  const startTime = Date.now();

  function calculateETA(current: number, total: number): string {
    if (current === 0) return '--:--';

    const elapsed = (Date.now() - startTime) / 1000;
    const rate = current / elapsed;
    const remaining = (total - current) / rate;

    if (remaining < 60) {
      return `${Math.round(remaining)} 秒`;
    }
    const mins = Math.floor(remaining / 60);
    const secs = Math.round(remaining % 60);
    return `${mins}分${secs.toString().padStart(2, '0')}秒`;
  }

  $: clampedPercent = Math.max(0, Math.min(100, percent));
  $: color = statusColor[status] || statusColor.idle;
  $: text = statusText[status] || statusText.idle;
</script>

<div class="progress-bar-wrapper">
  <div class="progress-header">
    <span class="status-text" style={`color: ${color};`}>{text}</span>
    <span class="percent-text">{Math.round(clampedPercent)}%</span>
  </div>

  <div class="progress-track">
    <div
      class="progress-fill"
      style={`
        width: ${clampedPercent}%;
        background: linear-gradient(90deg, ${color}, ${color}dd);
      `}
    >
      <div class="progress-shine"></div>
    </div>
  </div>

  {#if showDetails && totalFrames > 0}
    <div class="progress-details">
      <span class="frame-info">帧: {currentFrame} / {totalFrames}</span>
      {#if status === 'rendering' || status === 'encoding'}
        <span class="eta-info">
          预计剩余: {calculateETA(currentFrame, totalFrames)}
        </span>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .progress-bar-wrapper {
    width: 100%;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .status-text {
    font-size: 13px;
    font-weight: 500;
    transition: color 0.3s;
  }

  .percent-text {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    font-family: monospace;
  }

  .progress-track {
    position: relative;
    width: 100%;
    height: 12px;
    background: #f0f0f0;
    border-radius: 6px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease, background 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .progress-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: shine 2s ease-in-out infinite;
  }

  @keyframes shine {
    to {
      left: 150%;
    }
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 11px;
    color: #999;
  }

  .frame-info {
    font-family: monospace;
  }

  .eta-info {
    color: #666;
  }
</style>
