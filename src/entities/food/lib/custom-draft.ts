import type { CustomFoodInput } from './custom-food';
import type { CustomFood } from '@/shared/db';

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

export function draftFromCustomFood(food: CustomFood): CustomDraft {
  return { name: food.name, kcal: String(food.kcal), photo: food.photo ?? '' };
}

export function draftToCustomFood(draft: CustomDraft): CustomFoodInput | null {
  const name = draft.name.trim();
  const kcal = Number(draft.kcal.trim());

  if (!name || !Number.isInteger(kcal) || kcal < MIN_KCAL || kcal > MAX_KCAL) {
    return null;
  }

  return { name, kcal, photo: draft.photo || undefined };
}
