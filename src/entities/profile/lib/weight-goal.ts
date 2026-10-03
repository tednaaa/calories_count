import type { Goal } from '@/shared/db';

const LOSING: Goal[] = ['cut', 'cutMild'];
const GAINING: Goal[] = ['bulkMild', 'bulk'];
const MAINTAIN_TOLERANCE_KG = 1;

export function isGainingGoal(goal: Goal): boolean {
  return GAINING.includes(goal);
}

export type WeightToGo = { reached: true } | { reached: false; kg: number };

export function targetConflict(goal: Goal, weightKg: number, targetWeightKg: number): string | null {
  if (LOSING.includes(goal) && targetWeightKg >= weightKg) {
    return 'Цель — похудение, а целевой вес не ниже текущего.';
  }
  if (GAINING.includes(goal) && targetWeightKg <= weightKg) {
    return 'Цель — набор, а целевой вес не выше текущего.';
  }

  return null;
}

function isReached(goal: Goal, weightKg: number, targetWeightKg: number): boolean {
  if (LOSING.includes(goal)) {
    return weightKg <= targetWeightKg;
  }
  if (GAINING.includes(goal)) {
    return weightKg >= targetWeightKg;
  }

  return Math.abs(weightKg - targetWeightKg) <= MAINTAIN_TOLERANCE_KG;
}

export function weightToGo(goal: Goal, weightKg: number, targetWeightKg: number): WeightToGo {
  return isReached(goal, weightKg, targetWeightKg)
    ? { reached: true }
    : { reached: false, kg: Math.round(Math.abs(weightKg - targetWeightKg) * 10) / 10 };
}
