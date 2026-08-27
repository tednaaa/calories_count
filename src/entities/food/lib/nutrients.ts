import type { Basis, Nutrients } from '@/shared/db';

export type NutrientId = keyof Nutrients;

export const nutrientNames: Record<NutrientId, string> = {
  protein: 'Белки',
  fat: 'Жиры',
  saturatedFat: 'Насыщенные',
  carbs: 'Углеводы',
  sugars: 'Сахар',
  fiber: 'Клетчатка',
  salt: 'Соль',
};

const ids = Object.keys(nutrientNames) as NutrientId[];

const PRECISION = 10;

function round(value: number): number {
  return Math.round(value * PRECISION) / PRECISION;
}

function build(pick: (id: NutrientId) => number | undefined): Nutrients | undefined {
  const filled = ids.flatMap((id) => {
    const value = pick(id);

    return value === undefined ? [] : [[id, value] as const];
  });

  return filled.length ? Object.fromEntries(filled) : undefined;
}

export function scaleNutrients(nutrients: Nutrients | undefined, factor: number): Nutrients | undefined {
  return nutrients && build(id => (nutrients[id] === undefined ? undefined : round(nutrients[id] * factor)));
}

export function portionNutrients(basis: Basis, amount: number): Nutrients | undefined {
  return scaleNutrients(basis.nutrients, amount / basis.amount);
}

export function sumNutrients(parts: (Nutrients | undefined)[]): Nutrients | undefined {
  const filled = parts.filter((part): part is Nutrients => part !== undefined);

  if (!filled.length) {
    return undefined;
  }

  return build((id) => {
    const values = filled.flatMap(part => (part[id] === undefined ? [] : [part[id]]));

    return values.length ? round(values.reduce((sum, value) => sum + value, 0)) : undefined;
  });
}

export function formatNutrient(grams: number): string {
  return `${round(grams).toString().replace('.', ',')} г`;
}
