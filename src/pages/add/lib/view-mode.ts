import type { RemovableRef } from '@vueuse/core';
import { useLocalStorage } from '@vueuse/core';

export const viewModes = [
  { id: 'grid', name: 'Сетка' },
  { id: 'large', name: 'Крупно' },
  { id: 'list', name: 'Список' },
] as const;

export type ViewMode = typeof viewModes[number]['id'];

export const VIEW_MODE_KEY = 'add-view-mode';

export function viewModeName(mode: ViewMode): string {
  return viewModes.find(view => view.id === mode)?.name ?? viewModes[0].name;
}

export function useViewMode(): RemovableRef<ViewMode> {
  return useLocalStorage<ViewMode>(VIEW_MODE_KEY, 'grid');
}
