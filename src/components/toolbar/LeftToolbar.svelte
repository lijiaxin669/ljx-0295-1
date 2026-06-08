<script lang="ts">
  import { brush, brushConfig, currentTool, COLOR_PRESETS, WIDTH_PRESETS } from '../../stores/brushStore';
  import type { ToolType } from '../../types/canvas';

  const tools: { id: ToolType; icon: string; label: string }[] = [
    { id: 'brush', icon: '✏️', label: '画笔' },
    { id: 'eraser', icon: '🧹', label: '橡皮擦' },
    { id: 'text', icon: '📝', label: '文字' },
    { id: 'select', icon: '↔️', label: '选择/变换' }
  ];

  const handleToolChange = (tool: ToolType) => {
    brush.setTool(tool);
  };

  const handleColorChange = (color: string) => {
    brush.setColor(color);
  };

  const handleWidthChange = (width: number) => {
    brush.setWidth(width);
  };

  const handleOpacityChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    brush.setOpacity(parseFloat(target.value));
  };

  const handleColorInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    handleColorChange(target.value);
  };

  const handleWidthInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    handleWidthChange(parseInt(target.value));
  };

  $: currentColor = $brushConfig.color;
  $: currentWidth = $brushConfig.width;
  $: currentOpacity = $brushConfig.opacity;
  $: activeTool = $currentTool;
</script>

<div class="left-toolbar">
  <div class="tool-group">
    <div class="group-title">工具</div>
    <div class="tools">
      {#each tools as tool}
        <button
          class="tool-btn {activeTool === tool.id ? 'active' : ''}"
          on:click={() => handleToolChange(tool.id)}
          title={tool.label}
        >
          <span class="tool-icon">{tool.icon}</span>
          <span class="tool-label">{tool.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="tool-group">
    <div class="group-title">颜色</div>
    <div class="color-palette">
      {#each COLOR_PRESETS as color}
        <button
          class="color-swatch {currentColor === color ? 'active' : ''}"
          style={`background: ${color};`}
          on:click={() => handleColorChange(color)}
          title={color}
        >
          {#if currentColor === color}
            <span class="check">✓</span>
          {/if}
        </button>
      {/each}
    </div>
    <div class="custom-color">
      <input
        type="color"
        bind:value={currentColor}
        on:input={handleColorInput}
      />
      <span class="color-value">{currentColor}</span>
    </div>
  </div>

  <div class="tool-group">
    <div class="group-title">笔刷大小</div>
    <div class="width-presets">
      {#each WIDTH_PRESETS as width}
        <button
          class="width-btn {currentWidth === width ? 'active' : ''}"
          on:click={() => handleWidthChange(width)}
          title={`${width}px`}
        >
          <span class="dot" style={`width: ${Math.max(4, width / 2)}px; height: ${Math.max(4, width / 2)}px;`}></span>
        </button>
      {/each}
    </div>
    <div class="width-slider">
      <input
        type="range"
        min="1"
        max="50"
        bind:value={currentWidth}
        on:input={handleWidthInput}
      />
      <span class="width-value">{currentWidth}px</span>
    </div>
  </div>

  <div class="tool-group">
    <div class="group-title">透明度</div>
    <div class="opacity-slider">
      <input
        type="range"
        min="0.1"
        max="1"
        step="0.1"
        value={currentOpacity}
        on:input={handleOpacityChange}
      />
      <span class="opacity-value">{Math.round(currentOpacity * 100)}%</span>
    </div>
  </div>

  <div class="tool-group">
    <div class="group-title">预览</div>
    <div class="brush-preview">
      <svg width="100%" height="50">
        <line
          x1="10" y1="25" x2="110" y2="25"
          stroke={currentColor}
          stroke-width={currentWidth}
          stroke-opacity={currentOpacity}
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</div>

<style lang="scss">
  .left-toolbar {
    width: 180px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    overflow-y: auto;
  }

  .tool-group {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .group-title {
    font-size: 12px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }

  .tools {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    &.active {
      background: linear-gradient(135deg, rgba(196, 30, 58, 0.15), rgba(212, 175, 55, 0.15));
      box-shadow: inset 0 0 0 1px rgba(196, 30, 58, 0.3);

      .tool-icon {
        transform: scale(1.1);
      }
    }

    .tool-icon {
      font-size: 18px;
      transition: transform 0.2s;
    }

    .tool-label {
      font-size: 14px;
      color: #333;
    }
  }

  .color-palette {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .color-swatch {
    position: relative;
    width: 32px;
    height: 32px;
    border: 2px solid white;
    border-radius: 8px;
    cursor: pointer;
    padding: 0;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.1);
    }

    &.active {
      box-shadow: 0 0 0 2px #C41E3A, 0 2px 8px rgba(196, 30, 58, 0.3);
    }

    .check {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  }

  .custom-color {
    display: flex;
    align-items: center;
    gap: 8px;

    input[type="color"] {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      padding: 0;
    }

    .color-value {
      font-family: monospace;
      font-size: 12px;
      color: #666;
    }
  }

  .width-presets {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .width-btn {
    width: 28px;
    height: 28px;
    border: 1px solid #e0e0e0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      border-color: #ccc;
    }

    &.active {
      border-color: #C41E3A;
      background: rgba(196, 30, 58, 0.05);
    }

    .dot {
      background: #333;
      border-radius: 50%;
    }
  }

  .width-slider,
  .opacity-slider {
    display: flex;
    align-items: center;
    gap: 8px;

    input[type="range"] {
      flex: 1;
      height: 4px;
      -webkit-appearance: none;
      background: linear-gradient(to right, #C41E3A, #D4AF37);
      border-radius: 2px;
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: white;
        border: 2px solid #C41E3A;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }
  }

  .width-slider .width-value,
  .opacity-slider .opacity-value {
    font-size: 12px;
    color: #666;
    min-width: 40px;
    text-align: right;
  }

  .brush-preview {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
