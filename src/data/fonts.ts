import type { FontConfig } from '../types/text';

export const FONT_PRESETS: FontConfig[] = [
  {
    id: 'kaishu',
    name: '楷书',
    fontFamily: '"Ma Shan Zheng", cursive',
    category: 'calligraphy',
    fallback: '"KaiTi", "STKaiti", serif'
  },
  {
    id: 'xingshu',
    name: '行书',
    fontFamily: '"Liu Jian Mao Cao", cursive',
    category: 'calligraphy',
    fallback: '"XingKai", "STXingkai", cursive'
  },
  {
    id: 'lishu',
    name: '隶书',
    fontFamily: '"Zhi Mang Xing", cursive',
    category: 'calligraphy',
    fallback: '"LiSu", "STLiti", serif'
  },
  {
    id: 'songti',
    name: '宋体',
    fontFamily: '"Noto Serif SC", serif',
    category: 'regular',
    fallback: '"SimSun", "STSong", serif'
  },
  {
    id: 'heiti',
    name: '黑体',
    fontFamily: '"Noto Sans SC", sans-serif',
    category: 'regular',
    fallback: '"SimHei", "STHeiti", sans-serif'
  },
  {
    id: 'shouxie',
    name: '手写体',
    fontFamily: '"ZCOOL KuaiLe", cursive',
    category: 'handwriting',
    fallback: '"Comic Sans MS", cursive'
  }
];

export const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Liu+Jian+Mao+Cao&family=Zhi+Mang+Xing&family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=ZCOOL+KuaiLe&display=swap';

export const DEFAULT_FONT_ID = 'kaishu';

export const getFontById = (id: string): FontConfig | undefined => {
  return FONT_PRESETS.find(f => f.id === id);
};

export const getFontFamily = (id: string): string => {
  const font = getFontById(id);
  if (!font) return FONT_PRESETS[0].fontFamily + ', ' + FONT_PRESETS[0].fallback;
  return font.fontFamily + ', ' + font.fallback;
};

export const FONT_SIZE_PRESETS = [24, 32, 48, 64, 80, 96, 120];
