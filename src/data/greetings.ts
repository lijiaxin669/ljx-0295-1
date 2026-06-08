export interface Greeting {
  id: string;
  text: string;
  category: 'classic' | 'modern' | 'humorous' | 'business';
}

export const GREETINGS: Greeting[] = [
  { id: 'g1', text: '新年快乐', category: 'classic' },
  { id: 'g2', text: '万事如意', category: 'classic' },
  { id: 'g3', text: '恭喜发财', category: 'classic' },
  { id: 'g4', text: '身体健康', category: 'classic' },
  { id: 'g5', text: '工作顺利', category: 'classic' },
  { id: 'g6', text: '学业进步', category: 'classic' },
  { id: 'g7', text: '阖家幸福', category: 'classic' },
  { id: 'g8', text: '福星高照', category: 'classic' },
  { id: 'g9', text: '财运亨通', category: 'classic' },
  { id: 'g10', text: '吉祥如意', category: 'classic' },
  { id: 'g11', text: '2026 新年快乐！', category: 'modern' },
  { id: 'g12', text: '新年新气象，万事皆可期', category: 'modern' },
  { id: 'g13', text: '愿你新的日子里，眼里有光，心中有爱', category: 'modern' },
  { id: 'g14', text: '新的一年，成为更好的自己', category: 'modern' },
  { id: 'g15', text: '新年暴富暴美暴开心', category: 'humorous' },
  { id: 'g16', text: '没什么才艺，给您拜个早年', category: 'humorous' },
  { id: 'g17', text: '新年快乐，红包拿来', category: 'humorous' },
  { id: 'g18', text: '事业蒸蒸日上，业绩再创辉煌', category: 'business' },
  { id: 'g19', text: '合作共赢，共创佳绩', category: 'business' },
  { id: 'g20', text: '新春大吉，财源广进', category: 'business' }
];

export const getGreetingsByCategory = (category: string): Greeting[] => {
  if (category === 'all') return GREETINGS;
  return GREETINGS.filter(g => g.category === category);
};

export const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'classic', name: '经典祝福' },
  { id: 'modern', name: '现代简约' },
  { id: 'humorous', name: '幽默搞怪' },
  { id: 'business', name: '商务祝福' }
];
