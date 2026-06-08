import type { Template } from '../types/canvas';

export const TEMPLATES: Template[] = [
  {
    id: 'red-gold',
    name: 'red-gold',
    displayName: '红金国风',
    background: 'linear-gradient(135deg, #C41E3A 0%, #8B0000 50%, #C41E3A 100%)',
    borderStyle: '8px double #D4AF37',
    decorations: [
      {
        type: 'pattern',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
        color: '#D4AF37',
        opacity: 0.15
      },
      {
        type: 'shape',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        color: '#D4AF37',
        opacity: 0.3
      }
    ],
    defaultBrushColor: '#D4AF37',
    fontFamily: "'Ma Shan Zheng', 'Noto Serif SC', serif"
  },
  {
    id: 'minimal',
    name: 'minimal',
    displayName: '简约现代',
    background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 50%, #E8E8E8 100%)',
    borderStyle: '3px solid #E8D5A3',
    decorations: [
      {
        type: 'shape',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
        color: '#FF8C42',
        opacity: 0.1
      }
    ],
    defaultBrushColor: '#333333',
    fontFamily: "'Noto Serif SC', 'PingFang SC', sans-serif"
  }
];

export const getTemplateById = (id: string): Template => {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
};

export const getTemplateColors = (templateName: string) => {
  if (templateName === 'red-gold') {
    return {
      primary: '#C41E3A',
      secondary: '#D4AF37',
      accent: '#8B0000',
      background: '#C41E3A',
      text: '#D4AF37'
    };
  }
  return {
    primary: '#FAFAFA',
    secondary: '#E8D5A3',
    accent: '#FF8C42',
    background: '#FAFAFA',
    text: '#333333'
  };
};
