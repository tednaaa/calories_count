import type { Basis, Unit } from '@/shared/db';
import { formatNumber } from '@/shared/lib';

const unitNames: Record<Unit, string> = { g: 'г', ml: 'мл' };

export function portionKcal(basis: Basis, amount: number): number {
  return Math.round(basis.kcal * amount / basis.amount);
}

export function unitName(unit: Unit = 'g'): string {
  return unitNames[unit];
}

export function formatAmount(amount: number, unit?: Unit): string {
  return `${formatNumber(amount)} ${unitName(unit)}`;
}

export function formatServing(kcal: number, amount?: number, unit?: Unit): string {
  const calories = `${formatNumber(kcal)} ккал`;

  return amount === undefined ? calories : `${formatAmount(amount, unit)} · ${calories}`;
}
