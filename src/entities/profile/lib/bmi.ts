import type { Measurements } from './calories';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export const ADULT_AGE = 18;

const HEALTHY_BMI = { min: 18.5, max: 24.9 };

const CATEGORY_NAMES: Record<BmiCategory, string> = {
  underweight: 'недостаточный вес',
  normal: 'норма',
  overweight: 'избыточный вес',
  obese: 'ожирение',
};

function squaredHeight(heightCm: number): number {
  return (heightCm / 100) ** 2;
}

export function calcBmi(weightKg: number, heightCm: number): number {
  return weightKg / squaredHeight(heightCm);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return 'underweight';
  }
  if (bmi < 25) {
    return 'normal';
  }
  if (bmi < 30) {
    return 'overweight';
  }

  return 'obese';
}

export function healthyWeightRange(heightCm: number): { min: number; max: number } {
  return {
    min: Math.round(HEALTHY_BMI.min * squaredHeight(heightCm)),
    max: Math.round(HEALTHY_BMI.max * squaredHeight(heightCm)),
  };
}

export function describeBmi({ age, heightCm, weightKg }: Omit<Measurements, 'sex'>): string {
  const bmi = calcBmi(weightKg, heightCm);
  const shown = (Math.round(bmi * 10) / 10).toFixed(1).replace('.', ',');

  if (age < ADULT_AGE) {
    return `ИМТ ${shown} — до 18 лет его оценивают по таблицам ВОЗ с учётом возраста и пола`;
  }

  const { min, max } = healthyWeightRange(heightCm);

  return `ИМТ ${shown} — ${CATEGORY_NAMES[bmiCategory(bmi)]}, норма для ${heightCm} см: ${min}–${max} кг`;
}
