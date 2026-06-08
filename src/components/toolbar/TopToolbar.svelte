<script lang="ts">
  import { get } from 'svelte/store';
  import { templateId, availableTemplates } from '../../stores/templateStore';
  import { canvas } from '../../stores/canvasStore';
  import { stickers } from '../../stores/stickerStore';
  import { animation } from '../../stores/animationStore';
  import { downloadProject, loadProjectFromFile, isValidProjectFile } from '../../utils/canvas/serializer';

  let showTemplateMenu = false;
  let fileInput: HTMLInputElement;

  const handleTemplateChange = (id: string) => {
    templateId.setTemplate(id);
    showTemplateMenu = false;
  };

  const handleUndo = () => canvas.undo();
  const handleRedo = () => canvas.redo();
  const handleClear = () => {
    if (confirm('确定要清空所有内容吗？')) {
      canvas.clear();
      stickers.clear();
    }
  };

  const handleExportJson = () => {
    const strokes = get(canvas).strokes;
    const stickerList = get(stickers);
    const template = get(templateId);
    const animConfig = get(animation);

    downloadProject(
      template,
      1920, 1080,
      strokes,
      stickerList,
      animConfig
    );
  };

  const handleImportJson = () => {
    fileInput.click();
  };

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!isValidProjectFile(file)) {
      alert('请选择有效的 JSON 项目文件');
      return;
    }

    try {
      const project = await loadProjectFromFile(file);
      templateId.setTemplate(project.template);
      canvas.setStrokes(project.strokes);
      stickers.setStickers(project.stickers);
      animation.setConfig(project.animationConfig);
      alert('项目加载成功！');
    } catch (error) {
      alert(`加载失败：${error instanceof Error ? error.message : '未知错误'}`);
    }

    input.value = '';
  };

  $: currentTemplateName = availableTemplates.find(t => t.id === $templateId)?.displayName || '';
  $: canUndo = $canvas.history.length > 0;
  $: canRedo = $canvas.redoStack.length > 0;
</script>

<div class="top-toolbar">
  <div class="toolbar-left">
    <div class="logo">
      <span class="logo-icon">🧧</span>
      <span class="logo-text">拜年贺卡工坊</span>
    </div>
  </div>

  <div class="toolbar-center">
    <div class="template-selector" on:click={() => showTemplateMenu = !showTemplateMenu}>
      <span class="template-label">模板：</span>
      <span class="template-name">{currentTemplateName}</span>
      <span class="arrow">▼</span>

      {#if showTemplateMenu}
        <div class="template-dropdown">
          {#each availableTemplates as template}
            <div
              class="template-option {$templateId === template.id ? 'active' : ''}"
              on:click={(e) => { e.stopPropagation(); handleTemplateChange(template.id); }}
            >
              <div class="template-preview" style={`background: ${template.background};`}></div>
              <span>{template.displayName}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="toolbar-right">
    <button class="tool-btn" on:click={handleUndo} disabled={!canUndo} title="撤销">
      ↶
    </button>
    <button class="tool-btn" on:click={handleRedo} disabled={!canRedo} title="重做">
      ↷
    </button>
    <button class="tool-btn" on:click={handleClear} title="清空">
      🗑️
    </button>
    <div class="divider"></div>
    <button class="tool-btn" on:click={handleImportJson} title="导入 JSON">
      📥
    </button>
    <button class="tool-btn" on:click={handleExportJson} title="导出 JSON">
      📤
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept=".json,application/json"
      style="display: none;"
      on:change={handleFileChange}
    />
  </div>
</div>

<style lang="scss">
  .top-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;

    .logo-icon {
      font-size: 28px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(135deg, #C41E3A, #D4AF37);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .template-selector {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: linear-gradient(135deg, #e0e0e0, #d0d0d0);
      transform: translateY(-1px);
    }

    .template-label {
      color: #666;
      font-size: 14px;
    }

    .template-name {
      font-weight: 600;
      color: #333;
    }

    .arrow {
      font-size: 12px;
      color: #999;
    }
  }

  .template-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    z-index: 200;
  }

  .template-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }

    &.active {
      background: rgba(196, 30, 58, 0.1);

      .template-preview {
        box-shadow: 0 0 0 2px #C41E3A;
      }
    }

    .template-preview {
      width: 40px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .divider {
    width: 1px;
    height: 24px;
    background: #e0e0e0;
    margin: 0 4px;
  }

  .tool-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
</style>
