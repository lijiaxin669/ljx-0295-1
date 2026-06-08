<script lang="ts">
  import { onMount } from 'svelte';
  import Canvas from './components/canvas/Canvas.svelte';
  import TopToolbar from './components/toolbar/TopToolbar.svelte';
  import LeftToolbar from './components/toolbar/LeftToolbar.svelte';
  import BottomBar from './components/toolbar/BottomBar.svelte';
  import StickerPanel from './components/sticker/StickerPanel.svelte';
  import LayerPanel from './components/layer/LayerPanel.svelte';
  import TextEditor from './components/text/TextEditor.svelte';
  import PreviewModal from './components/preview/PreviewModal.svelte';
  import ExportModal from './components/export/ExportModal.svelte';
  import { exportStore } from './stores/exportStore';
  import { textLayers } from './stores/textLayerStore';
  import { FONT_PRESETS } from './data/fonts';
  import type { TextLayer } from './types/text';

  let showPreview = false;
  let showExport = false;
  let showTextEditor = false;
  let editingText: TextLayer | null = null;
  let textEditorPosition = { x: 960, y: 540 };

  const handlePreview = () => {
    showPreview = true;
  };

  const handlePreviewClose = () => {
    showPreview = false;
  };

  const handlePreviewExport = () => {
    showPreview = false;
    showExport = true;
    exportStore.openModal();
  };

  const handleExport = () => {
    showExport = true;
    exportStore.openModal();
  };

  const handleExportClose = () => {
    showExport = false;
    exportStore.closeModal();
  };

  const handleCreateText = (e: CustomEvent<{ x: number; y: number }>) => {
    textEditorPosition = { x: e.detail.x, y: e.detail.y };
    editingText = null;
    showTextEditor = true;
  };

  const handleEditText = (e: CustomEvent<{ layer: TextLayer }>) => {
    editingText = e.detail.layer;
    textEditorPosition = { x: e.detail.layer.x, y: e.detail.layer.y };
    showTextEditor = true;
  };

  const handleTextCreate = (e: CustomEvent<Partial<TextLayer>>) => {
    const defaults = {
      content: '新年快乐',
      fontFamily: FONT_PRESETS[0].fontFamily,
      fontSize: 72,
      color: '#C41E3A',
      fontWeight: 'normal' as const,
      writingMode: 'horizontal' as const,
      textAlign: 'center' as const,
      lineHeight: 1.5,
      letterSpacing: 2,
      charAnimation: true
    };

    const layerData: Partial<TextLayer> = {
      ...defaults,
      ...e.detail,
      x: textEditorPosition.x,
      y: textEditorPosition.y
    };

    textLayers.addTextLayer(layerData);
    showTextEditor = false;
    editingText = null;
  };

  const handleTextUpdate = (e: CustomEvent<Partial<TextLayer>>) => {
    if (!editingText) return;
    textLayers.updateTextLayer(editingText.id, e.detail);
    showTextEditor = false;
    editingText = null;
  };

  const handleTextClose = () => {
    showTextEditor = false;
    editingText = null;
  };

  onMount(() => {
    console.log('🎊 拜年贺卡工坊已启动');
    console.log('💡 提示：在画布上书写祝福，添加贴纸，然后导出视频');
  });
</script>

<div class="app-container">
  <header class="app-header">
    <TopToolbar />
  </header>

  <main class="app-main">
    <aside class="app-sidebar-left">
      <LeftToolbar />
    </aside>

    <section class="app-content">
      <Canvas
        on:createText={handleCreateText}
        on:editText={handleEditText}
      />
      <StickerPanel canvasWidth={1920} canvasHeight={1080} />
      <LayerPanel />
    </section>
  </main>

  <footer class="app-footer">
    <BottomBar on:preview={handlePreview} on:export={handleExport} />
  </footer>

  <PreviewModal
    show={showPreview}
    on:close={handlePreviewClose}
    on:export={handlePreviewExport}
  />

  <ExportModal
    show={showExport}
    on:close={handleExportClose}
  />

  <TextEditor
    show={showTextEditor}
    editingLayer={editingText}
    on:create={handleTextCreate}
    on:update={handleTextUpdate}
    on:close={handleTextClose}
  />
</div>

<style lang="scss">
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background: linear-gradient(135deg, #fef6f6 0%, #fff9f0 50%, #fef6f6 100%);
  }

  .app-header {
    flex-shrink: 0;
    z-index: 10;
  }

  .app-main {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .app-sidebar-left {
    flex-shrink: 0;
    z-index: 5;
  }

  .app-content {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .app-footer {
    flex-shrink: 0;
    z-index: 10;
  }
</style>
