import type { CustomItem } from '@/entities/entry';

export const MIN_KCAL = 1;
export const MAX_KCAL = 5000;

export interface CustomDraft {
  name: string;
  kcal: string;
  photo: string;
}

export function emptyCustomDraft(): CustomDraft {
  return { name: '', kcal: '', photo: '' };
}

export function draftToCustomItem(draft: CustomDraft): CustomItem | null {
  const name = draft.name.trim();
  const kcal = Number(draft.kcal.trim());

  if (!name || !Number.isInteger(kcal) || kcal < MIN_KCAL || kcal > MAX_KCAL) {
    return null;
  }

  return { name, kcalPerPortion: kcal, photo: draft.photo || undefined };
}
