import type { Basis } from '@/shared/db';
import { formatNumber } from '@/shared/lib';

export function portionKcal(basis: Basis, grams: number): number {
  return Math.round(basis.kcal * grams / basis.grams);
}

export function formatGrams(grams: number): string {
  return `${formatNumber(grams)} г`;
}

export function formatServing(kcal: number, grams?: number): string {
  const calories = `${formatNumber(kcal)} ккал`;

  return grams === undefined ? calories : `${formatGrams(grams)} · ${calories}`;
}
