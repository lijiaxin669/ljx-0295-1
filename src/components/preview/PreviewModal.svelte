<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import AnimationPlayer from './AnimationPlayer.svelte';
  import { animation } from '../../stores/animationStore';

  export let show = false;

  const dispatch = createEventDispatcher();

  const handleClose = () => {
    animation.stop();
    dispatch('close');
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && show) {
      handleClose();
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    animation.stop();
  });

  $: if (show) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
</script>

{#if show}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <div class="modal-header">
        <h2 id="preview-title">
          <span class="header-icon">🎬</span>
          笔迹动画预览
        </h2>
        <button class="close-btn" on:click={handleClose} aria-label="关闭">
          <span class="close-icon">✕</span>
        </button>
      </div>

      <div class="modal-body">
        <div class="preview-info">
          <div class="info-item">
            <span class="info-label">时长</span>
            <span class="info-value">15 秒</span>
          </div>
          <div class="info-item">
            <span class="info-label">分辨率</span>
            <span class="info-value">1920 × 1080</span>
          </div>
          <div class="info-item">
            <span class="info-label">帧率</span>
            <span class="info-value">30 FPS</span>
          </div>
        </div>

        <AnimationPlayer width={640} height={360} />

        <div class="preview-tips">
          <div class="tip-title">💡 小贴士</div>
          <ul class="tip-list">
            <li>点击播放按钮查看笔迹逐字显现效果</li>
            <li>拖动进度条可快速跳转到指定位置</li>
            <li>调整播放速度观察不同的书写节奏</li>
            <li>满意后点击「导出」生成视频文件</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={handleClose}>
          返回编辑
        </button>
        <button class="btn btn-primary" on:click={() => dispatch('export')}>
          <span class="btn-icon">📤</span>
          导出视频
        </button>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-container {
    background: white;
    border-radius: 20px;
    max-width: 760px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-icon {
      font-size: 24px;
    }
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: #e8e8e8;
      transform: rotate(90deg);
    }

    .close-icon {
      font-size: 16px;
      color: #666;
    }
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: calc(90vh - 140px);
  }

  .preview-info {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.05), rgba(212, 175, 55, 0.05));
    border-radius: 12px;
    border: 1px solid rgba(196, 30, 58, 0.1);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .info-label {
    font-size: 11px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .info-value {
    font-size: 14px;
    font-weight: 600;
    color: #C41E3A;
  }

  .preview-tips {
    margin-top: 24px;
    padding: 16px 20px;
    background: #fafafa;
    border-radius: 12px;
    border-left: 4px solid #D4AF37;
  }

  .tip-title {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .tip-list {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    color: #666;
    line-height: 1.8;

    li {
      margin-bottom: 2px;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    background: #fafafa;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .btn-secondary {
    background: #f0f0f0;
    color: #333;

    &:hover {
      background: #e0e0e0;
    }
  }

  .btn-primary {
    background: linear-gradient(135deg, #C41E3A, #D4AF37);
    color: white;

    &:hover {
      box-shadow: 0 4px 16px rgba(196, 30, 58, 0.4);
    }
  }

  .btn-icon {
    font-size: 16px;
  }
</style>
