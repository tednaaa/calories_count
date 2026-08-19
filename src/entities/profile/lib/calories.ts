import type { ActivityLevel, Goal, Profile, Sex } from '@/shared/db';

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  veryHigh: 1.9,
};

export const GOAL_FACTOR: Record<Goal, number> = {
  cut: 0.8,
  cutMild: 0.85,
  maintain: 1,
  bulkMild: 1.1,
  bulk: 1.15,
};

export const SAFE_MINIMUM_KCAL: Record<Sex, number> = {
  male: 1500,
  female: 1200,
};

export const LIMITS = {
  age: { min: 14, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 300 },
} as const;

export type Measurements = Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg'>;
export type CalcInput = Measurements & Pick<Profile, 'activity' | 'goal'>;

export interface TargetBreakdown {
  bmr: number;
  tdee: number;
  raw: number;
  target: number;
  clampedToMinimum: boolean;
}

export function calcBmr({ sex, age, heightCm, weightKg }: Measurements): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  return base + (sex === 'male' ? 5 : -161);
}

export function calcTdee(input: Measurements & Pick<Profile, 'activity'>): number {
  return calcBmr(input) * ACTIVITY_FACTOR[input.activity];
}

export function calcTarget(input: CalcInput): TargetBreakdown {
  const bmr = calcBmr(input);
  const tdee = calcTdee(input);
  const raw = tdee * GOAL_FACTOR[input.goal];
  const minimum = SAFE_MINIMUM_KCAL[input.sex];
  const rounded = Math.round(raw / 10) * 10;

  return {
    bmr,
    tdee,
    raw,
    target: Math.max(minimum, rounded),
    clampedToMinimum: rounded < minimum,
  };
}

export function isWithinLimits({ age, heightCm, weightKg }: Measurements): boolean {
  return age >= LIMITS.age.min && age <= LIMITS.age.max
    && heightCm >= LIMITS.heightCm.min && heightCm <= LIMITS.heightCm.max
    && weightKg >= LIMITS.weightKg.min && weightKg <= LIMITS.weightKg.max;
}
