<script lang="ts">
  import { derived, get } from 'svelte/store';
  import { canvas } from '../../stores/canvasStore';
  import { stickers, selectedSticker } from '../../stores/stickerStore';
  import { textLayers, selectedTextLayer } from '../../stores/textLayerStore';
  import type { LayerItem, LayerType } from '../../types/text';
  import type { Stroke } from '../../types/canvas';

  let showPanel = true;

  const allLayers = derived(
    [canvas, stickers, textLayers],
    ([$canvas, $stickers, $textLayers]) => {
      const layers: LayerItem[] = [];

      $canvas.strokes.forEach((stroke: Stroke, index: number) => {
        layers.push({
          id: `stroke-${stroke.id}`,
          type: 'stroke' as LayerType,
          name: `笔迹 ${index + 1}`,
          zIndex: index,
          locked: false,
          hidden: false,
          data: stroke
        });
      });

      $stickers.forEach(sticker => {
        layers.push({
          id: `sticker-${sticker.id}`,
          type: 'sticker' as LayerType,
          name: sticker.name,
          zIndex: sticker.zIndex,
          locked: false,
          hidden: false,
          data: sticker
        });
      });

      $textLayers.forEach(text => {
        layers.push({
          id: `text-${text.id}`,
          type: 'text' as LayerType,
          name: text.content.substring(0, 10) + (text.content.length > 10 ? '...' : ''),
          zIndex: text.zIndex,
          locked: text.locked,
          hidden: text.hidden,
          data: text
        });
      });

      return layers.sort((a, b) => a.zIndex - b.zIndex);
    }
  );

  const selectedId = derived(
    [selectedSticker, selectedTextLayer],
    ([$sticker, $text]) => {
      if ($sticker) return `sticker-${$sticker.id}`;
      if ($text) return `text-${$text.id}`;
      return null;
    }
  );

  const handleLayerClick = (layer: LayerItem) => {
    if (layer.type === 'sticker') {
      stickers.selectSticker(layer.data.id);
      textLayers.selectTextLayer(null);
    } else if (layer.type === 'text') {
      textLayers.selectTextLayer(layer.data.id);
      stickers.selectSticker(null);
    }
  };

  const handleBringToFront = (layer: LayerItem) => {
    if (layer.type === 'sticker') {
      stickers.bringForward(layer.data.id);
    } else if (layer.type === 'text') {
      textLayers.bringToFront(layer.data.id);
    }
  };

  const handleSendToBack = (layer: LayerItem) => {
    if (layer.type === 'sticker') {
      stickers.sendBackward(layer.data.id);
    } else if (layer.type === 'text') {
      textLayers.sendToBack(layer.data.id);
    }
  };

  const handleBringForward = (layer: LayerItem) => {
    if (layer.type === 'sticker') {
      stickers.bringForward(layer.data.id);
    } else if (layer.type === 'text') {
      textLayers.bringForward(layer.data.id);
    }
  };

  const handleSendBackward = (layer: LayerItem) => {
    if (layer.type === 'sticker') {
      stickers.sendBackward(layer.data.id);
    } else if (layer.type === 'text') {
      textLayers.sendBackward(layer.data.id);
    }
  };

  const handleToggleLock = (layer: LayerItem) => {
    if (layer.type === 'text') {
      textLayers.toggleLock(layer.data.id);
    }
  };

  const handleToggleVisibility = (layer: LayerItem) => {
    if (layer.type === 'text') {
      textLayers.toggleVisibility(layer.data.id);
    }
  };

  const handleDelete = (layer: LayerItem) => {
    if (layer.type === 'sticker') {
      stickers.deleteSticker(layer.data.id);
    } else if (layer.type === 'text') {
      textLayers.deleteTextLayer(layer.data.id);
    }
  };

  const handleDuplicate = (layer: LayerItem) => {
    if (layer.type === 'sticker') {
      stickers.duplicateSticker(layer.data.id);
    } else if (layer.type === 'text') {
      textLayers.duplicateTextLayer(layer.data.id);
    }
  };

  const getLayerIcon = (type: LayerType): string => {
    switch (type) {
      case 'stroke': return '✏️';
      case 'sticker': return '🖼️';
      case 'text': return '📝';
      default: return '📄';
    }
  };
</script>

<div class="layer-panel">
  <div class="panel-header">
    <button
      type="button"
      class="toggle-btn"
      on:click={() => showPanel = !showPanel}
      title={showPanel ? '收起图层' : '展开图层'}
    >
      {showPanel ? '▶' : '◀'} 图层
    </button>
  </div>

  {#if showPanel}
    <div class="panel-content">
      <div class="layers-header">
        <span class="layer-count">{$allLayers.length} 个图层</span>
      </div>

      <div class="layers-list">
        {#if $allLayers.length === 0}
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <span class="empty-text">暂无图层</span>
            <span class="empty-hint">在画布上书写或添加元素</span>
          </div>
        {:else}
          {#each [...$allLayers].reverse() as layer (layer.id)}
            <button
              type="button"
              class="layer-item {$selectedId === layer.id ? 'selected' : ''} {layer.locked ? 'locked' : ''}"
              on:click={() => handleLayerClick(layer)}
            >
              <span class="layer-icon">{getLayerIcon(layer.type)}</span>
              <span class="layer-name" title={layer.name}>{layer.name}</span>

              {#if layer.type !== 'stroke'}
                <div class="layer-actions">
                  <button
                    type="button"
                    class="action-btn"
                    on:click|stopPropagation={() => handleToggleVisibility(layer)}
                    title={layer.hidden ? '显示' : '隐藏'}
                  >
                    {layer.hidden ? '👁️‍🗨️' : '👁️'}
                  </button>
                  <button
                    type="button"
                    class="action-btn"
                    on:click|stopPropagation={() => handleToggleLock(layer)}
                    title={layer.locked ? '解锁' : '锁定'}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                </div>
              {/if}
            </button>
          {/each}
        {/if}
      </div>

      {#if $selectedId}
        <div class="layer-toolbar">
          <button
            type="button"
            class="toolbar-btn"
            on:click={() => {
              const layer = $allLayers.find(l => l.id === $selectedId);
              if (layer) handleBringToFront(layer);
            }}
            title="置顶"
            disabled={!$selectedId}
          >
            ⬆️
          </button>
          <button
            type="button"
            class="toolbar-btn"
            on:click={() => {
              const layer = $allLayers.find(l => l.id === $selectedId);
              if (layer) handleBringForward(layer);
            }}
            title="上移一层"
            disabled={!$selectedId}
          >
            ↑
          </button>
          <button
            type="button"
            class="toolbar-btn"
            on:click={() => {
              const layer = $allLayers.find(l => l.id === $selectedId);
              if (layer) handleSendBackward(layer);
            }}
            title="下移一层"
            disabled={!$selectedId}
          >
            ↓
          </button>
          <button
            type="button"
            class="toolbar-btn"
            on:click={() => {
              const layer = $allLayers.find(l => l.id === $selectedId);
              if (layer) handleSendToBack(layer);
            }}
            title="置底"
            disabled={!$selectedId}
          >
            ⬇️
          </button>
          <div class="toolbar-divider"></div>
          <button
            type="button"
            class="toolbar-btn"
            on:click={() => {
              const layer = $allLayers.find(l => l.id === $selectedId);
              if (layer) handleDuplicate(layer);
            }}
            title="复制"
            disabled={!$selectedId || $selectedId.startsWith('stroke-')}
          >
            📋
          </button>
          <button
            type="button"
            class="toolbar-btn delete"
            on:click={() => {
              const layer = $allLayers.find(l => l.id === $selectedId);
              if (layer) handleDelete(layer);
            }}
            title="删除"
            disabled={!$selectedId || $selectedId.startsWith('stroke-')}
          >
            🗑️
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .layer-panel {
    position: absolute;
    right: 20px;
    top: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    z-index: 100;
    min-width: 240px;
    overflow: hidden;
  }

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .toggle-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      padding: 4px 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }
  }

  .panel-content {
    max-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .layers-header {
    padding: 8px 16px;
    font-size: 12px;
    color: #999;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .layers-list {
    flex: 1;
    overflow-y: auto;
    max-height: 280px;
    padding: 4px;
  }

  .layer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 2px;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    &.selected {
      background: linear-gradient(135deg, rgba(196, 30, 58, 0.1), rgba(212, 175, 55, 0.1));
      box-shadow: inset 0 0 0 1px rgba(196, 30, 58, 0.3);
    }

    &.locked {
      opacity: 0.6;
    }

    .layer-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .layer-name {
      flex: 1;
      font-size: 13px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .layer-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .layer-actions {
      opacity: 1;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 12px;
      transition: background 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #999;
    gap: 8px;

    .empty-icon {
      font-size: 32px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 14px;
      font-weight: 500;
    }

    .empty-hint {
      font-size: 12px;
      opacity: 0.7;
    }
  }

  .layer-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.02);

    .toolbar-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.1);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &.delete:hover:not(:disabled) {
        background: rgba(196, 30, 58, 0.1);
        color: #C41E3A;
      }
    }

    .toolbar-divider {
      width: 1px;
      height: 20px;
      background: rgba(0, 0, 0, 0.1);
      margin: 0 4px;
    }
  }
</style>
