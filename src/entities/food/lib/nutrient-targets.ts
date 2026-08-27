import type { NutrientId } from './nutrients';
import { nutrientNames } from './nutrients';

export type TargetGoal = 'reach' | 'limit';

export interface NutrientTarget {
  id: NutrientId;
  name: string;
  goal: TargetGoal;
  amount: number;
}

const PROTEIN_PER_KG = 1.6;
const FIBER_PER_DAY = 30;
const SALT_PER_DAY = 5;
const SUGAR_SHARE = 0.1;
const KCAL_PER_CARB_GRAM = 4;

export const plainNutrients: NutrientId[] = ['fat', 'saturatedFat', 'carbs'];

export function nutrientTargets(weightKg: number, targetKcal: number): NutrientTarget[] {
  const amounts: Omit<NutrientTarget, 'name'>[] = [
    { id: 'protein', goal: 'reach', amount: Math.round(weightKg * PROTEIN_PER_KG) },
    { id: 'sugars', goal: 'limit', amount: Math.round(targetKcal * SUGAR_SHARE / KCAL_PER_CARB_GRAM) },
    { id: 'fiber', goal: 'reach', amount: FIBER_PER_DAY },
    { id: 'salt', goal: 'limit', amount: SALT_PER_DAY },
  ];

  return amounts.map(target => ({ ...target, name: nutrientNames[target.id] }));
}

export function targetRatio(eaten: number, target: NutrientTarget): number {
  return target.amount > 0 ? eaten / target.amount : 0;
}

export function meetsTarget(eaten: number, target: NutrientTarget): boolean {
  return target.goal === 'reach' ? eaten >= target.amount : eaten <= target.amount;
}
