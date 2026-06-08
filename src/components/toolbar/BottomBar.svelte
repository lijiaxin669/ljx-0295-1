<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { GREETINGS, CATEGORIES, getGreetingsByCategory } from '../../data/greetings';
  import { textLayers } from '../../stores/textLayerStore';
  import { FONT_PRESETS } from '../../data/fonts';
  import { exportStore } from '../../stores/exportStore';
  import type { TextLayer } from '../../types/text';

  const dispatch = createEventDispatcher<{
    preview: void;
    export: void;
  }>();

  let selectedCategory = 'all';
  let showGreetingMenu = false;

  const handleGreetingSelect = (text: string) => {
    const layerData: Partial<TextLayer> = {
      content: text,
      fontFamily: FONT_PRESETS[0].fontFamily,
      fontSize: 72,
      color: '#C41E3A',
      fontWeight: 'normal',
      writingMode: 'horizontal',
      textAlign: 'center',
      x: 960,
      y: 540,
      lineHeight: 1.5,
      letterSpacing: 4,
      charAnimation: true
    };

    textLayers.addTextLayer(layerData);
    showGreetingMenu = false;
  };

  const handlePreview = () => {
    dispatch('preview');
  };

  const handleExport = () => {
    exportStore.openModal();
    dispatch('export');
  };

  $: greetings = getGreetingsByCategory(selectedCategory);
</script>

<div class="bottom-bar">
  <div class="greeting-section">
    <div class="greeting-selector" on:click={() => showGreetingMenu = !showGreetingMenu}>
      <span class="greeting-icon">💬</span>
      <span class="greeting-label">选择祝福语</span>
      <span class="arrow">▼</span>
    </div>

    {#if showGreetingMenu}
      <div class="greeting-dropdown" on:click|stopPropagation>
        <div class="category-tabs">
          {#each CATEGORIES as cat}
            <button
              class="cat-btn {selectedCategory === cat.id ? 'active' : ''}"
              on:click={() => selectedCategory = cat.id}
            >
              {cat.name}
            </button>
          {/each}
        </div>
        <div class="greeting-list">
          {#each greetings as greeting}
            <button
              class="greeting-item"
              on:click={() => handleGreetingSelect(greeting.text)}
            >
              {greeting.text}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="action-buttons">
    <button class="btn btn-secondary" on:click={handlePreview}>
      <span class="btn-icon">▶️</span>
      <span>预览动画</span>
    </button>
    <button class="btn btn-primary" on:click={handleExport}>
      <span class="btn-icon">📹</span>
      <span>导出视频</span>
    </button>
  </div>
</div>

<style lang="scss">
  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px;
    padding: 0 24px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    position: sticky;
    bottom: 0;
    z-index: 100;
  }

  .greeting-section {
    position: relative;
  }

  .greeting-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #f8f8f8, #ececec);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: linear-gradient(135deg, #ececec, #e0e0e0);
      transform: translateY(-1px);
    }

    .greeting-icon {
      font-size: 18px;
    }

    .greeting-label {
      font-weight: 500;
      color: #333;
    }

    .arrow {
      font-size: 12px;
      color: #999;
    }
  }

  .greeting-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    width: 400px;
    margin-bottom: 12px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    z-index: 200;
  }

  .category-tabs {
    display: flex;
    gap: 4px;
    padding: 12px 12px 0;
    border-bottom: 1px solid #f0f0f0;
    overflow-x: auto;

    .cat-btn {
      flex-shrink: 0;
      padding: 6px 14px;
      border: none;
      background: transparent;
      border-radius: 20px;
      font-size: 13px;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
      }

      &.active {
        background: linear-gradient(135deg, #C41E3A, #D4AF37);
        color: white;
      }
    }
  }

  .greeting-list {
    max-height: 250px;
    overflow-y: auto;
    padding: 8px;
  }

  .greeting-item {
    display: block;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    border-radius: 8px;
    text-align: left;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(196, 30, 58, 0.08);
      color: #C41E3A;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    .btn-icon {
      font-size: 18px;
    }
  }

  .btn-secondary {
    background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
    color: #333;

    &:hover {
      background: linear-gradient(135deg, #e0e0e0, #d0d0d0);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .btn-primary {
    background: linear-gradient(135deg, #C41E3A, #D4AF37);
    color: white;
    box-shadow: 0 4px 15px rgba(196, 30, 58, 0.3);

    &:hover {
      box-shadow: 0 6px 20px rgba(196, 30, 58, 0.4);
    }
  }
</style>
