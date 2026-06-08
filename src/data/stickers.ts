import type { StickerCategory, StickerItem } from '../types/sticker';

export const STICKER_CATEGORIES: StickerCategory[] = [
  {
    id: 'decoration',
    name: '装饰',
    items: [
      { id: 'lantern-1', name: '大红灯笼', src: '/src/assets/stickers/lantern-1.svg', type: 'lantern', defaultWidth: 120, defaultHeight: 180 },
      { id: 'lantern-2', name: '小灯笼串', src: '/src/assets/stickers/lantern-2.svg', type: 'lantern', defaultWidth: 200, defaultHeight: 150 },
      { id: 'firecracker', name: '鞭炮', src: '/src/assets/stickers/firecracker.svg', type: 'decoration', defaultWidth: 100, defaultHeight: 180 },
      { id: 'cloud', name: '祥云', src: '/src/assets/stickers/cloud.svg', type: 'decoration', defaultWidth: 150, defaultHeight: 80 },
      { id: 'flower', name: '梅花', src: '/src/assets/stickers/flower.svg', type: 'decoration', defaultWidth: 120, defaultHeight: 120 },
      { id: 'knot', name: '中国结', src: '/src/assets/stickers/knot.svg', type: 'decoration', defaultWidth: 100, defaultHeight: 160 }
    ]
  },
  {
    id: 'text',
    name: '文字',
    items: [
      { id: 'fu', name: '福字', src: '/src/assets/stickers/fu.svg', type: 'fu', defaultWidth: 150, defaultHeight: 150 },
      { id: 'chun', name: '春字', src: '/src/assets/stickers/chun.svg', type: 'fu', defaultWidth: 150, defaultHeight: 150 },
      { id: 'xi', name: '喜字', src: '/src/assets/stickers/xi.svg', type: 'fu', defaultWidth: 150, defaultHeight: 150 }
    ]
  },
  {
    id: 'zodiac',
    name: '生肖',
    items: [
      { id: 'horse', name: '马', src: '/src/assets/stickers/zodiac-horse.svg', type: 'zodiac', defaultWidth: 160, defaultHeight: 160 },
      { id: 'zodiac-1', name: '生肖卡通1', src: '/src/assets/stickers/zodiac-1.svg', type: 'zodiac', defaultWidth: 140, defaultHeight: 140 },
      { id: 'zodiac-2', name: '生肖卡通2', src: '/src/assets/stickers/zodiac-2.svg', type: 'zodiac', defaultWidth: 140, defaultHeight: 140 }
    ]
  }
];

export const getAllStickers = (): StickerItem[] => {
  return STICKER_CATEGORIES.flatMap(cat => cat.items);
};

export const getStickerById = (id: string): StickerItem | undefined => {
  return getAllStickers().find(s => s.id === id);
};
