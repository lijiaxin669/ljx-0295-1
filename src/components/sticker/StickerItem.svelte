<script lang="ts">
  import type { StickerItem } from '../../types/sticker';

  export let item: StickerItem;
  export let onSelect: (id: string) => void;

  let imageLoaded = false;
  let imageError = false;

  const handleClick = () => {
    onSelect(item.id);
  };

  const handleLoad = () => {
    imageLoaded = true;
  };

  const handleError = () => {
    imageError = true;
    imageLoaded = true;
  };
</script>

<button type="button" class="sticker-item" on:click={handleClick} title={item.name}>
  <div class="sticker-preview">
    {#if !imageLoaded}
      <div class="sticker-loading">
        <div class="spinner"></div>
      </div>
    {/if}
    {#if imageError}
      <div class="sticker-error">
        <span class="error-icon">⚠️</span>
      </div>
    {/if}
    <img
      src={item.src}
      alt={item.name}
      class:loaded={imageLoaded && !imageError}
      on:load={handleLoad}
      on:error={handleError}
      draggable={false}
    />
  </div>
  <span class="sticker-name">{item.name}</span>
</button>

<style lang="scss">
  .sticker-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    border: 2px solid transparent;

    &:hover {
      background: rgba(196, 30, 58, 0.08);
      border-color: rgba(196, 30, 58, 0.2);
      transform: translateY(-2px);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  .sticker-preview {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.3s ease;
      user-select: none;
      -webkit-user-drag: none;

      &.loaded {
        opacity: 1;
      }
    }
  }

  .sticker-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(196, 30, 58, 0.2);
      border-top-color: #C41E3A;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }

  .sticker-error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .error-icon {
      font-size: 24px;
    }
  }

  .sticker-name {
    font-size: 11px;
    color: #666;
    text-align: center;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 72px;
  }
</style>
