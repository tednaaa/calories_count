import type { CustomFoodInput } from './custom-food';
import type { Basis, CustomFood, Grades, Nutrients, Unit } from '@/shared/db';
import { portionNutrients } from './nutrients';
import { formatAmount, portionKcal, unitName } from './serving';

export const MIN_KCAL = 1;
export const MAX_KCAL = 5000;
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 5000;
export const HUNDRED = 100;

export type ServingId = 'portion' | 'hundred' | 'custom';

export const units: { id: Unit; name: string }[] = [
  { id: 'g', name: unitName('g') },
  { id: 'ml', name: unitName('ml') },
];

export function servingOptions(unit: Unit): { id: ServingId; name: string }[] {
  return [
    { id: 'portion', name: 'Порция' },
    { id: 'hundred', name: formatAmount(HUNDRED, unit) },
    { id: 'custom', name: 'Своё' },
  ];
}

export type Serving = Pick<CustomFoodInput, 'kcal' | 'amount' | 'unit' | 'basis' | 'nutrients' | 'grades'>;

export interface CustomDraft {
  name: string;
  serving: ServingId;
  unit: Unit;
  amount: string;
  kcal: string;
  portion: string;
  nutrients?: Nutrients;
  grades?: Grades;
  photo: string;
}

export function emptyCustomDraft(): CustomDraft {
  return { name: '', serving: 'portion', unit: 'g', amount: '', kcal: '', portion: '', photo: '' };
}

function wholeWithin(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function basisAmount(draft: CustomDraft): number | undefined {
  if (draft.serving === 'portion') {
    return undefined;
  }

  return draft.serving === 'hundred' ? HUNDRED : Number(draft.amount.trim());
}

export function draftToServing(draft: CustomDraft): Serving | null {
  const kcal = Number(draft.kcal.trim());

  if (!wholeWithin(kcal, MIN_KCAL, MAX_KCAL)) {
    return null;
  }

  const base = basisAmount(draft);

  if (base === undefined) {
    return { kcal };
  }

  const amount = draft.portion.trim() ? Number(draft.portion.trim()) : base;

  if (!wholeWithin(base, MIN_AMOUNT, MAX_AMOUNT) || !wholeWithin(amount, MIN_AMOUNT, MAX_AMOUNT)) {
    return null;
  }

  const basis: Basis = { amount: base, kcal, nutrients: draft.nutrients };

  return {
    kcal: portionKcal(basis, amount),
    amount,
    unit: draft.unit,
    basis,
    nutrients: portionNutrients(basis, amount),
    grades: draft.grades,
  };
}

export function servingToDraft(serving: Serving): Omit<CustomDraft, 'name' | 'photo'> {
  const basis = serving.basis
    ?? (serving.amount === undefined ? undefined : { amount: serving.amount, kcal: serving.kcal });

  if (basis === undefined) {
    return { serving: 'portion', unit: 'g', amount: '', kcal: String(serving.kcal), portion: '' };
  }

  const portion = serving.amount ?? basis.amount;

  return {
    serving: basis.amount === HUNDRED ? 'hundred' : 'custom',
    unit: serving.unit ?? 'g',
    amount: String(basis.amount),
    kcal: String(basis.kcal),
    portion: portion === basis.amount ? '' : String(portion),
    nutrients: basis.nutrients,
    grades: serving.grades,
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
