<script lang="ts">
  import { get } from 'svelte/store';
  import { STICKER_CATEGORIES } from '../../data/stickers';
  import { stickers, selectedSticker } from '../../stores/stickerStore';
  import StickerItem from './StickerItem.svelte';
  import type { StickerCategory } from '../../types/sticker';

  export let canvasWidth = 1920;
  export let canvasHeight = 1080;

  let activeCategory: string = STICKER_CATEGORIES[0]?.id || '';
  let showPanel = true;

  const handleStickerSelect = (itemId: string) => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    stickers.addSticker(itemId, centerX, centerY);
  };

  const handleDeleteSticker = () => {
    const sticker = get(selectedSticker);
    if (sticker) {
      stickers.deleteSticker(sticker.id);
    }
  };

  const handleDuplicateSticker = () => {
    const sticker = get(selectedSticker);
    if (sticker) {
      stickers.duplicateSticker(sticker.id);
    }
  };

  const handleBringForward = () => {
    const sticker = get(selectedSticker);
    if (sticker) {
      stickers.bringForward(sticker.id);
    }
  };

  const handleSendBackward = () => {
    const sticker = get(selectedSticker);
    if (sticker) {
      stickers.sendBackward(sticker.id);
    }
  };

  const handleFlipX = () => {
    const sticker = get(selectedSticker);
    if (sticker) {
      stickers.updateSticker(sticker.id, { flipX: !sticker.flipX });
    }
  };

  const handleFlipY = () => {
    const sticker = get(selectedSticker);
    if (sticker) {
      stickers.updateSticker(sticker.id, { flipY: !sticker.flipY });
    }
  };

  $: currentCategory = STICKER_CATEGORIES.find(c => c.id === activeCategory);
  $: hasSelected = $selectedSticker !== null;
  $: stickerCount = $stickers.length;
</script>

<div class="sticker-panel {showPanel ? 'open' : 'closed'}">
  <button class="toggle-btn" on:click={() => showPanel = !showPanel}>
    {showPanel ? '◀' : '▶'}
    <span class="toggle-text">贴纸</span>
  </button>

  {#if showPanel}
    <div class="panel-content">
      <div class="panel-header">
        <h3>贴纸库</h3>
        <span class="sticker-count">已添加 {stickerCount}</span>
      </div>

      <div class="category-tabs">
        {#each STICKER_CATEGORIES as category}
          <button
            class="tab-btn {activeCategory === category.id ? 'active' : ''}"
            on:click={() => activeCategory = category.id}
          >
            {category.name}
            <span class="tab-count">{category.items.length}</span>
          </button>
        {/each}
      </div>

      <div class="sticker-grid">
        {#if currentCategory}
          {#each currentCategory.items as item (item.id)}
            <StickerItem item={item} onSelect={handleStickerSelect} />
          {/each}
        {/if}
      </div>

      {#if hasSelected}
        <div class="selected-actions">
          <div class="section-title">选中贴纸</div>
          <div class="selected-info">
            <span class="selected-name">{$selectedSticker?.name}</span>
          </div>
          <div class="action-buttons">
            <button class="action-btn" on:click={handleDuplicateSticker} title="复制">
              <span class="btn-icon">📋</span>
              <span class="btn-text">复制</span>
            </button>
            <button class="action-btn" on:click={handleDeleteSticker} title="删除">
              <span class="btn-icon">🗑️</span>
              <span class="btn-text">删除</span>
            </button>
          </div>
          <div class="action-buttons">
            <button class="action-btn" on:click={handleFlipX} title="水平翻转">
              <span class="btn-icon">↔️</span>
              <span class="btn-text">左右翻转</span>
            </button>
            <button class="action-btn" on:click={handleFlipY} title="垂直翻转">
              <span class="btn-icon">↕️</span>
              <span class="btn-text">上下翻转</span>
            </button>
          </div>
          <div class="action-buttons">
            <button class="action-btn" on:click={handleBringForward} title="上移一层">
              <span class="btn-icon">⬆️</span>
              <span class="btn-text">上移</span>
            </button>
            <button class="action-btn" on:click={handleSendBackward} title="下移一层">
              <span class="btn-icon">⬇️</span>
              <span class="btn-text">下移</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .sticker-panel {
    position: absolute;
    top: 60px;
    right: 0;
    height: calc(100% - 120px);
    display: flex;
    align-items: flex-start;
    z-index: 100;

    &.closed {
      .panel-content {
        transform: translateX(100%);
        opacity: 0;
        pointer-events: none;
      }
    }

    &.open {
      .panel-content {
        transform: translateX(0);
        opacity: 1;
        pointer-events: auto;
      }
    }
  }

  .toggle-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 80px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-right: none;
    border-radius: 12px 0 0 12px;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 2;
    margin-top: 20px;

    &:hover {
      background: white;
      box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
    }

    .toggle-text {
      font-size: 10px;
      writing-mode: vertical-rl;
      margin-top: 4px;
      color: #666;
    }
  }

  .panel-content {
    width: 300px;
    height: 100%;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .sticker-count {
      font-size: 12px;
      color: #999;
      background: #f5f5f5;
      padding: 4px 10px;
      border-radius: 12px;
    }
  }

  .category-tabs {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px;
    border: none;
    background: transparent;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    color: #666;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #333;
    }

    &.active {
      background: linear-gradient(135deg, #C41E3A, #D4AF37);
      color: white;
      font-weight: 500;
    }

    .tab-count {
      font-size: 11px;
      opacity: 0.8;
    }
  }

  .sticker-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 12px;
    overflow-y: auto;
    align-content: start;
  }

  .selected-actions {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding: 16px;
    background: #fafafa;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .selected-info {
    margin-bottom: 12px;

    .selected-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 12px;
    border: 1px solid #e0e0e0;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    color: #333;
    transition: all 0.2s;

    &:hover {
      background: rgba(196, 30, 58, 0.05);
      border-color: rgba(196, 30, 58, 0.3);
    }

    &:active {
      transform: scale(0.98);
    }

    .btn-icon {
      font-size: 14px;
    }
  }
</style>
