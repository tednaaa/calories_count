import type { CustomFoodInput } from './custom-food';
import type { Basis, CustomFood } from '@/shared/db';
import { formatGrams, portionKcal } from './serving';

export const MIN_KCAL = 1;
export const MAX_KCAL = 5000;
export const MIN_GRAMS = 1;
export const MAX_GRAMS = 5000;
export const HUNDRED_GRAMS = 100;

export type ServingId = 'portion' | 'hundred' | 'custom';

export const servings: { id: ServingId; name: string }[] = [
  { id: 'portion', name: 'Порция' },
  { id: 'hundred', name: formatGrams(HUNDRED_GRAMS) },
  { id: 'custom', name: 'Своё' },
];

export type Serving = Pick<CustomFoodInput, 'kcal' | 'grams' | 'basis'>;

export interface CustomDraft {
  name: string;
  serving: ServingId;
  grams: string;
  kcal: string;
  portion: string;
  photo: string;
}

export function emptyCustomDraft(): CustomDraft {
  return { name: '', serving: 'portion', grams: '', kcal: '', portion: '', photo: '' };
}

function wholeWithin(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function basisGrams(draft: CustomDraft): number | undefined {
  if (draft.serving === 'portion') {
    return undefined;
  }

  return draft.serving === 'hundred' ? HUNDRED_GRAMS : Number(draft.grams.trim());
}

export function draftToServing(draft: CustomDraft): Serving | null {
  const kcal = Number(draft.kcal.trim());

  if (!wholeWithin(kcal, MIN_KCAL, MAX_KCAL)) {
    return null;
  }

  const base = basisGrams(draft);

  if (base === undefined) {
    return { kcal };
  }

  const grams = draft.portion.trim() ? Number(draft.portion.trim()) : base;

  if (!wholeWithin(base, MIN_GRAMS, MAX_GRAMS) || !wholeWithin(grams, MIN_GRAMS, MAX_GRAMS)) {
    return null;
  }

  const basis: Basis = { grams: base, kcal };

  return { kcal: portionKcal(basis, grams), grams, basis };
}

export function servingToDraft(serving: Serving): Omit<CustomDraft, 'name' | 'photo'> {
  const basis = serving.basis
    ?? (serving.grams === undefined ? undefined : { grams: serving.grams, kcal: serving.kcal });

  if (basis === undefined) {
    return { serving: 'portion', grams: '', kcal: String(serving.kcal), portion: '' };
  }

  const portion = serving.grams ?? basis.grams;

  return {
    serving: basis.grams === HUNDRED_GRAMS ? 'hundred' : 'custom',
    grams: String(basis.grams),
    kcal: String(basis.kcal),
    portion: portion === basis.grams ? '' : String(portion),
  };
}

export function draftFromCustomFood(food: CustomFood): CustomDraft {
  return {
    name: food.name,
    ...servingToDraft(food),
    photo: food.photo ?? '',
  };
}

export function draftToCustomFood(draft: CustomDraft): CustomFoodInput | null {
  const name = draft.name.trim();
  const serving = draftToServing(draft);

  if (!name || !serving) {
    return null;
  }

  return { name, ...serving, photo: draft.photo || undefined };
}
