<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { FONT_PRESETS, FONT_SIZE_PRESETS, getFontFamily } from '../../data/fonts';
  import { COLOR_PRESETS } from '../../stores/brushStore';
  import type { TextAlign, WritingMode, TextLayer } from '../../types/text';

  export let show = false;
  export let editText: TextLayer | null = null;
  export let defaultX = 960;
  export let defaultY = 540;

  const dispatch = createEventDispatcher<{
    create: Partial<TextLayer>;
    update: Partial<TextLayer> & { id: string };
    close: void;
  }>();

  let content = '新年快乐';
  let fontFamilyId = 'kaishu';
  let fontSize = 48;
  let color = '#D4AF37';
  let fontWeight: 'normal' | 'bold' = 'normal';
  let writingMode: WritingMode = 'horizontal';
  let textAlign: TextAlign = 'center';
  let lineHeight = 1.5;
  let letterSpacing = 2;
  let charAnimation = true;

  const textAlignOptions: { value: TextAlign; label: string; icon: string }[] = [
    { value: 'top-left', label: '左上', icon: '↖' },
    { value: 'top-center', label: '上中', icon: '↑' },
    { value: 'top-right', label: '右上', icon: '↗' },
    { value: 'middle-left', label: '左中', icon: '←' },
    { value: 'center', label: '居中', icon: '⊙' },
    { value: 'middle-right', label: '右中', icon: '→' },
    { value: 'bottom-left', label: '左下', icon: '↙' },
    { value: 'bottom-center', label: '下中', icon: '↓' },
    { value: 'bottom-right', label: '右下', icon: '↘' }
  ];

  $: fontFamilyCss = getFontFamily(fontFamilyId);
  $: fontFamily = getFontFamily(fontFamilyId);

  const handleConfirm = () => {
    if (!content.trim()) {
      alert('请输入文字内容');
      return;
    }

    const textData = {
      content,
      fontFamily,
      fontSize,
      color,
      fontWeight,
      writingMode,
      textAlign,
      lineHeight,
      letterSpacing,
      charAnimation
    };

    if (editText) {
      dispatch('update', { id: editText.id, ...textData });
    } else {
      dispatch('create', { x: defaultX, y: defaultY, ...textData });
    }
    handleClose();
  };

  const getFontIdFromFamily = (family: string): string => {
    const font = FONT_PRESETS.find(f => f.fontFamily === family);
    return font ? font.id : 'kaishu';
  };

  const handleClose = () => {
    dispatch('close');
    content = '新年快乐';
    fontFamilyId = 'kaishu';
    fontSize = 48;
    color = '#D4AF37';
    fontWeight = 'normal';
    writingMode = 'horizontal';
    textAlign = 'center';
    lineHeight = 1.5;
    letterSpacing = 2;
    charAnimation = true;
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  onMount(() => {
    if (editText) {
      content = editText.content;
      fontFamilyId = getFontIdFromFamily(editText.fontFamily);
      fontSize = editText.fontSize;
      color = editText.color;
      fontWeight = editText.fontWeight;
      writingMode = editText.writingMode;
      textAlign = editText.textAlign;
      lineHeight = editText.lineHeight;
      letterSpacing = editText.letterSpacing;
      charAnimation = editText.charAnimation;
    }
  });

  $: if (show && editText) {
    content = editText.content;
    fontFamilyId = getFontIdFromFamily(editText.fontFamily);
    fontSize = editText.fontSize;
    color = editText.color;
    fontWeight = editText.fontWeight;
    writingMode = editText.writingMode;
    textAlign = editText.textAlign;
    lineHeight = editText.lineHeight;
    letterSpacing = editText.letterSpacing;
    charAnimation = editText.charAnimation;
  }
</script>

{#if show}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="text-editor-title">
      <div class="modal-header">
        <h3 id="text-editor-title">{editText ? '编辑文字' : '添加文字'}</h3>
        <button type="button" class="close-btn" on:click={handleClose} aria-label="关闭">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="text-content">文字内容</label>
          <textarea
            id="text-content"
            bind:value={content}
            rows={4}
            placeholder="请输入祝福语..."
            autofocus
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="font-family">字体</label>
            <select id="font-family" bind:value={fontFamilyId}>
              {#each FONT_PRESETS as font}
                <option value={font.id}>{font.name}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="font-size">字号</label>
            <select id="font-size" bind:value={fontSize}>
              {#each FONT_SIZE_PRESETS as size}
                <option value={size}>{size}px</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>颜色</label>
          <div class="color-palette">
            {#each COLOR_PRESETS as c}
              <button
                type="button"
                class="color-swatch {color === c ? 'active' : ''}"
                style={`background: ${c};`}
                on:click={() => color = c}
                title={c}
              >
                {#if color === c}
                  <span class="check">✓</span>
                {/if}
              </button>
            {/each}
            <input
              type="color"
              bind:value={color}
              class="color-input"
              title="自定义颜色"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>粗体</label>
            <button
              type="button"
              class="toggle-btn {fontWeight === 'bold' ? 'active' : ''}"
              on:click={() => fontWeight = fontWeight === 'bold' ? 'normal' : 'bold'}
            >
              <strong>B</strong>
            </button>
          </div>

          <div class="form-group">
            <label>排版方向</label>
            <div class="toggle-group">
              <button
                type="button"
                class="toggle-btn {writingMode === 'horizontal' ? 'active' : ''}"
                on:click={() => writingMode = 'horizontal'}
              >
                横排
              </button>
              <button
                type="button"
                class="toggle-btn {writingMode === 'vertical' ? 'active' : ''}"
                on:click={() => writingMode = 'vertical'}
              >
                竖排
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>对齐方式（九宫格）</label>
          <div class="align-grid">
            {#each textAlignOptions as opt}
              <button
                type="button"
                class="align-btn {textAlign === opt.value ? 'active' : ''}"
                on:click={() => textAlign = opt.value}
                title={opt.label}
              >
                {opt.icon}
              </button>
            {/each}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="line-height">行高：{lineHeight.toFixed(1)}</label>
            <input
              id="line-height"
              type="range"
              min="1"
              max="3"
              step="0.1"
              bind:value={lineHeight}
            />
          </div>

          <div class="form-group">
            <label for="letter-spacing">字距：{letterSpacing}px</label>
            <input
              id="letter-spacing"
              type="range"
              min="0"
              max="20"
              step="1"
              bind:value={letterSpacing}
            />
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={charAnimation} />
            启用逐字书写动画
          </label>
        </div>

        <div class="preview-group">
          <label>预览</label>
          <div class="text-preview">
            <p
              style={`
                font-family: ${fontFamilyCss};
                font-size: ${fontSize / 2}px;
                color: ${color};
                font-weight: ${fontWeight};
                ${writingMode === 'vertical' ? 'writing-mode: vertical-rl;' : ''}
                line-height: ${lineHeight};
                letter-spacing: ${letterSpacing}px;
              `}
            >
              {content || '预览文字'}
            </p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={handleClose}>取消</button>
        <button type="button" class="btn btn-primary" on:click={handleConfirm}>
          {editText ? '保存修改' : '添加文字'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(4px);
  }

  .modal-container {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;

    h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
        color: #333;
      }
    }
  }

  .modal-body {
    padding: 24px;
  }

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  textarea, select {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #C41E3A;
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .color-palette {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .color-swatch {
    width: 32px;
    height: 32px;
    border: 2px solid white;
    border-radius: 8px;
    cursor: pointer;
    padding: 0;
    position: relative;
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

  .color-input {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    padding: 0;
  }

  .toggle-btn {
    padding: 8px 16px;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      border-color: #ccc;
    }

    &.active {
      border-color: #C41E3A;
      background: rgba(196, 30, 58, 0.1);
      color: #C41E3A;
    }
  }

  .toggle-group {
    display: flex;
    gap: 4px;

    .toggle-btn {
      flex: 1;
      border-radius: 8px 0 0 8px;

      &:last-child {
        border-radius: 0 8px 8px 0;
      }
    }
  }

  .align-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .align-btn {
    padding: 12px;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;

    &:hover {
      border-color: #ccc;
    }

    &.active {
      border-color: #C41E3A;
      background: rgba(196, 30, 58, 0.1);
      color: #C41E3A;
    }
  }

  input[type="range"] {
    width: 100%;
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

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: normal;
    font-size: 14px;
    color: #333;

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #C41E3A;
    }
  }

  .preview-group {
    background: #f9f9f9;
    border-radius: 12px;
    padding: 20px;
    text-align: center;

    .text-preview {
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 1px dashed #ddd;

      p {
        margin: 0;
        text-align: center;
        word-break: break-all;
      }
    }
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #eee;
    justify-content: flex-end;
  }

  .btn {
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-secondary {
      background: #f5f5f5;
      color: #666;

      &:hover {
        background: #e8e8e8;
      }
    }

    &.btn-primary {
      background: linear-gradient(135deg, #C41E3A, #D4AF37);
      color: white;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
      }
    }
  }
</style>
