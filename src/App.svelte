<script lang="ts">
  import { onMount } from 'svelte';
  import Canvas from './components/canvas/Canvas.svelte';
  import TopToolbar from './components/toolbar/TopToolbar.svelte';
  import LeftToolbar from './components/toolbar/LeftToolbar.svelte';
  import BottomBar from './components/toolbar/BottomBar.svelte';
  import StickerPanel from './components/sticker/StickerPanel.svelte';
  import PreviewModal from './components/preview/PreviewModal.svelte';
  import ExportModal from './components/export/ExportModal.svelte';
  import { exportStore } from './stores/exportStore';

  let showPreview = false;
  let showExport = false;

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
      <Canvas />
      <StickerPanel canvasWidth={1920} canvasHeight={1080} />
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
