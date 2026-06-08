import { writable, derived } from 'svelte/store';
import { TEMPLATES, getTemplateById, getTemplateColors } from '../data/templates';
import type { Template } from '../types/canvas';

const createTemplateStore = () => {
  const { subscribe, set, update } = writable<string>('red-gold');

  return {
    subscribe,
    setTemplate: (id: string) => set(id),
    reset: () => set('red-gold')
  };
};

export const templateId = createTemplateStore();

export const currentTemplate = derived<Template>(templateId, $id => getTemplateById($id));

export const templateColors = derived(templateId, $id => getTemplateColors($id));

export const availableTemplates = TEMPLATES;
