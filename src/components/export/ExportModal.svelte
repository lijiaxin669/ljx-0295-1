<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import ProgressBar from './ProgressBar.svelte';
  import { exportStore, exportConfig, exportProgress, isExporting } from '../../stores/exportStore';
  import { canvas } from '../../stores/canvasStore';
  import { currentTemplate } from '../../stores/templateStore';
  import { stickers } from '../../stores/stickerStore';
  import { RESOLUTION_MAP, QUALITY_PARAMS } from '../../types/export';
  import type { ExportFormat, ExportResolution, ExportQuality, ExportFPS } from '../../types/export';
  import { exportWithFFmpeg, loadFFmpeg } from '../../utils/export/ffmpeg';

  export let show = false;

  const dispatch = createEventDispatcher();

  let ffmpegLoaded = false;
  let ffmpegLoading = false;

  const formats: { id: ExportFormat; label: string; icon: string; desc: string }[] = [
    { id: 'mp4', label: 'MP4 视频', icon: '🎬', desc: '高清视频，适合微信群分享' },
    { id: 'gif', label: 'GIF 动图', icon: '🖼️', desc: '动态图片，兼容性最好' }
  ];

  const resolutions: { id: ExportResolution; label: string }[] = [
    { id: '720p', label: '720p HD' },
    { id: '1080p', label: '1080p Full HD' },
    { id: '2K', label: '2K QHD' }
  ];

  const qualities: { id: ExportQuality; label: string; desc: string }[] = [
    { id: 'low', label: '快速', desc: '文件小，速度快' },
    { id: 'medium', label: '均衡', desc: '质量和速度平衡' },
    { id: 'high', label: '高质量', desc: '画质好，文件较大' }
  ];

  const fpsOptions: { id: ExportFPS; label: string }[] = [
    { id: 30, label: '30 FPS' },
    { id: 60, label: '60 FPS' }
  ];

  const handleFormatChange = (format: ExportFormat) => {
    exportStore.setFormat(format);
  };

  const handleResolutionChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    exportStore.setResolution(target.value as ExportResolution);
  };

  const handleQualityChange = (quality: ExportQuality) => {
    exportStore.setQuality(quality);
  };

  const handleFpsChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    exportStore.setFps(parseInt(target.value) as ExportFPS);
  };

  const handleBackgroundToggle = () => {
    exportStore.setIncludeBackground(!$exportConfig.includeBackground);
  };

  const handleStickersToggle = () => {
    exportStore.setIncludeStickers(!$exportConfig.includeStickers);
  };

  const handleLoopToggle = () => {
    exportStore.setLoop(!$exportConfig.loop);
  };

  const initFFmpeg = async () => {
    if (ffmpegLoaded || ffmpegLoading) return;
    ffmpegLoading = true;
    try {
      await loadFFmpeg();
      ffmpegLoaded = true;
    } catch (e) {
      console.error('FFmpeg 加载失败:', e);
    } finally {
      ffmpegLoading = false;
    }
  };

  const handleStartExport = async () => {
    const config = get(exportConfig);
    const strokes = get(canvas).strokes;
    const template = get(currentTemplate);
    const stickerList = get(stickers);

    if (strokes.length === 0) {
      alert('请先在画布上书写内容后再导出');
      return;
    }

    try {
      exportStore.startProgress(config.duration * config.fps);
      exportStore.setStatus('preparing');

      if (!ffmpegLoaded) {
        await initFFmpeg();
      }

      const result = await exportWithFFmpeg(
        strokes,
        template,
        stickerList,
        config,
        (frame, total) => {
          const status = frame < total * 0.8 ? 'rendering' : 'encoding';
          exportStore.updateProgress(frame, status);
        }
      );

      exportStore.setResult(result);
      exportStore.setStatus('completed');
    } catch (error) {
      console.error('导出失败:', error);
      exportStore.setError(error instanceof Error ? error.message : '导出失败，请重试');
    }
  };

  const handleDownload = () => {
    const result = get(exportStore.result);
    if (!result) return;

    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    exportStore.reset();
  };

  const handleClose = () => {
    if (!$isExporting) {
      exportStore.closeModal();
      dispatch('close');
    }
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget && !$isExporting) {
      handleClose();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && show && !$isExporting) {
      handleClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    initFFmpeg();
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });

  $: config = $exportConfig;
  $: progress = $exportProgress;
  $: exporting = $isExporting;
  $: result = $exportStore.result;
  $: estimatedSize = estimateFileSize(config);
  $: totalFrames = config.duration * config.fps;

  function estimateFileSize(cfg: typeof config): string {
    const res = RESOLUTION_MAP[cfg.resolution];
    const quality = QUALITY_PARAMS[cfg.quality];
    const bitrate = parseInt(quality.bitrate) * 1000000;
    const bytes = (bitrate * cfg.duration) / 8;
    return formatFileSize(bytes);
  }
</script>

{#if show}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-container" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>
          <span class="header-icon">📤</span>
          导出视频
        </h2>
        <button
          class="close-btn"
          on:click={handleClose}
          disabled={exporting}
          aria-label="关闭"
        >
          <span class="close-icon">✕</span>
        </button>
      </div>

      <div class="modal-body">
        {#if progress.status === 'idle' || progress.status === 'preparing'}
          <div class="export-config">
            <div class="config-section">
              <div class="section-title">输出格式</div>
              <div class="format-options">
                {#each formats as fmt}
                  <button
                    class="format-btn {config.format === fmt.id ? 'active' : ''}"
                    on:click={() => handleFormatChange(fmt.id)}
                    disabled={exporting}
                  >
                    <span class="format-icon">{fmt.icon}</span>
                    <div class="format-info">
                      <span class="format-name">{fmt.label}</span>
                      <span class="format-desc">{fmt.desc}</span>
                    </div>
                    {#if config.format === fmt.id}
                      <span class="check-mark">✓</span>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>

            <div class="config-section">
              <div class="section-title">视频设置</div>
              <div class="setting-grid">
                <div class="setting-item">
                  <label for="resolution-select" class="setting-label">分辨率</label>
                  <select
                    id="resolution-select"
                    value={config.resolution}
                    on:change={handleResolutionChange}
                    disabled={exporting}
                    class="setting-select"
                  >
                    {#each resolutions as res}
                      <option value={res.id}>{res.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="setting-item">
                  <label for="fps-select" class="setting-label">帧率</label>
                  <select
                    id="fps-select"
                    value={config.fps}
                    on:change={handleFpsChange}
                    disabled={exporting}
                    class="setting-select"
                  >
                    {#each fpsOptions as fps}
                      <option value={fps.id}>{fps.label}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>

            <div class="config-section">
              <div class="section-title">质量</div>
              <div class="quality-options">
                {#each qualities as q}
                  <button
                    class="quality-btn {config.quality === q.id ? 'active' : ''}"
                    on:click={() => handleQualityChange(q.id)}
                    disabled={exporting}
                  >
                    <span class="quality-name">{q.label}</span>
                    <span class="quality-desc">{q.desc}</span>
                  </button>
                {/each}
              </div>
            </div>

            <div class="config-section">
              <div class="section-title">包含内容</div>
              <div class="toggle-options">
                <label class="toggle-item">
                  <input
                    type="checkbox"
                    checked={config.includeBackground}
                    on:change={handleBackgroundToggle}
                    disabled={exporting}
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">模板背景</span>
                </label>
                <label class="toggle-item">
                  <input
                    type="checkbox"
                    checked={config.includeStickers}
                    on:change={handleStickersToggle}
                    disabled={exporting}
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">贴纸装饰</span>
                </label>
                <label class="toggle-item">
                  <input
                    type="checkbox"
                    checked={config.loop}
                    on:change={handleLoopToggle}
                    disabled={exporting || config.format !== 'gif'}
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">循环播放 {config.format !== 'gif' ? '(仅GIF)' : ''}</span>
                </label>
              </div>
            </div>

            <div class="export-summary">
              <div class="summary-item">
                <span class="summary-label">时长</span>
                <span class="summary-value">{config.duration} 秒</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">总帧数</span>
                <span class="summary-value">{totalFrames} 帧</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">预计大小</span>
                <span class="summary-value">~ {estimatedSize}</span>
              </div>
            </div>
          </div>
        {:else if progress.status === 'completed' && result}
          <div class="export-complete">
            <div class="complete-icon">✅</div>
            <h3>导出成功！</h3>
            <div class="file-info">
              <div class="info-row">
                <span class="info-label">文件名</span>
                <span class="info-value">{result.filename}</span>
              </div>
              <div class="info-row">
                <span class="info-label">格式</span>
                <span class="info-value">{result.format.toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">大小</span>
                <span class="info-value">{formatFileSize(result.size)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">时长</span>
                <span class="info-value">{result.duration} 秒</span>
              </div>
            </div>
            <div class="complete-actions">
              <button class="btn btn-primary" on:click={handleDownload}>
                <span class="btn-icon">💾</span>
                下载文件
              </button>
              <button class="btn btn-secondary" on:click={handleRetry}>
                重新导出
              </button>
            </div>
          </div>
        {:else if progress.status === 'error'}
          <div class="export-error">
            <div class="error-icon">❌</div>
            <h3>导出失败</h3>
            <p class="error-message">{progress.error || '未知错误，请重试'}</p>
            <div class="error-tips">
              <p>💡 可能的解决方案：</p>
              <ul>
                <li>确保使用 Chrome 浏览器</li>
                <li>检查网络连接（需要加载 FFmpeg）</li>
                <li>尝试降低分辨率或质量</li>
              </ul>
            </div>
            <button class="btn btn-primary" on:click={handleRetry}>
              重新尝试
            </button>
          </div>
        {:else}
          <div class="export-progress">
            <div class="progress-icon">
              {#if progress.status === 'preparing'}
                ⚙️
              {:else if progress.status === 'rendering'}
                🎨
              {:else}
                📹
              {/if}
            </div>
            <h3>
              {progress.status === 'preparing' ? '正在准备...' :
               progress.status === 'rendering' ? '正在渲染帧...' :
               '正在编码...'}
            </h3>
            <p class="progress-desc">请耐心等待，不要关闭页面</p>

            <ProgressBar
              percent={progress.percent}
              status={progress.status}
              currentFrame={progress.currentFrame}
              totalFrames={progress.totalFrames}
            />

            {#if ffmpegLoading}
              <div class="ffmpeg-loading">
                <div class="spinner"></div>
                <span>正在加载 FFmpeg 转码引擎...</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        {#if progress.status === 'idle'}
          <button class="btn btn-secondary" on:click={handleClose} disabled={exporting}>
            取消
          </button>
          <button
            class="btn btn-primary"
            on:click={handleStartExport}
            disabled={exporting || ffmpegLoading}
          >
            <span class="btn-icon">🚀</span>
            开始导出
          </button>
        {/if}
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
    max-width: 600px;
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

    &:hover:not(:disabled) {
      background: #e8e8e8;
      transform: rotate(90deg);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

  .config-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }

  .format-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .format-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;

    &:hover:not(:disabled) {
      border-color: rgba(196, 30, 58, 0.3);
      background: rgba(196, 30, 58, 0.02);
    }

    &.active {
      border-color: #C41E3A;
      background: rgba(196, 30, 58, 0.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .format-icon {
      font-size: 28px;
    }

    .format-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .format-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .format-desc {
      font-size: 11px;
      color: #999;
    }

    .check-mark {
      color: #C41E3A;
      font-weight: bold;
      font-size: 16px;
    }
  }

  .setting-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .setting-label {
    font-size: 12px;
    color: #666;
  }

  .setting-select {
    padding: 10px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    color: #333;
    background: white;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;

    &:hover:not(:disabled),
    &:focus:not(:disabled) {
      border-color: #C41E3A;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .quality-options {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }

  .quality-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: rgba(196, 30, 58, 0.3);
    }

    &.active {
      border-color: #C41E3A;
      background: rgba(196, 30, 58, 0.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quality-name {
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }

    .quality-desc {
      font-size: 10px;
      color: #999;
      text-align: center;
    }
  }

  .toggle-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .toggle-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    user-select: none;

    input {
      display: none;

      &:checked + .toggle-slider {
        background: linear-gradient(135deg, #C41E3A, #D4AF37);

        &::after {
          transform: translateX(20px);
        }
      }

      &:disabled + .toggle-slider {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .toggle-slider {
      position: relative;
      width: 44px;
      height: 24px;
      background: #ddd;
      border-radius: 12px;
      transition: all 0.2s;

      &::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    .toggle-label {
      font-size: 14px;
      color: #333;
    }
  }

  .export-summary {
    display: flex;
    justify-content: space-around;
    padding: 16px;
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.05), rgba(212, 175, 55, 0.05));
    border-radius: 12px;
    border: 1px solid rgba(196, 30, 58, 0.1);
    margin-top: 24px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .summary-label {
    font-size: 11px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .summary-value {
    font-size: 14px;
    font-weight: 600;
    color: #C41E3A;
  }

  .export-progress,
  .export-complete,
  .export-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 0;
  }

  .progress-icon,
  .complete-icon,
  .error-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 20px;
    color: #333;
  }

  .progress-desc {
    color: #666;
    margin: 0 0 24px;
  }

  .ffmpeg-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding: 12px 16px;
    background: #fffbeb;
    border-radius: 8px;
    font-size: 13px;
    color: #92400e;

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(212, 175, 55, 0.3);
      border-top-color: #D4AF37;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }

  .file-info {
    width: 100%;
    max-width: 300px;
    margin: 16px 0 24px;
    padding: 16px;
    background: #f9f9f9;
    border-radius: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;

    &:last-child {
      border-bottom: none;
    }
  }

  .info-label {
    color: #999;
    font-size: 13px;
  }

  .info-value {
    color: #333;
    font-size: 13px;
    font-weight: 500;
    font-family: monospace;
  }

  .complete-actions {
    display: flex;
    gap: 12px;
  }

  .error-message {
    color: #F44336;
    margin: 8px 0 16px;
    font-size: 14px;
  }

  .error-tips {
    text-align: left;
    padding: 16px;
    background: #fff5f5;
    border-radius: 8px;
    margin-bottom: 20px;
    max-width: 360px;

    p {
      margin: 0 0 8px;
      color: #333;
      font-size: 13px;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      font-size: 12px;
      color: #666;
      line-height: 1.8;
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

    &:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-secondary {
    background: #f0f0f0;
    color: #333;

    &:hover:not(:disabled) {
      background: #e0e0e0;
    }
  }

  .btn-primary {
    background: linear-gradient(135deg, #C41E3A, #D4AF37);
    color: white;

    &:hover:not(:disabled) {
      box-shadow: 0 4px 16px rgba(196, 30, 58, 0.4);
    }
  }

  .btn-icon {
    font-size: 16px;
  }
</style>
