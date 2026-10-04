import { toDateKey, yearsBefore } from '@/shared/lib';
import { bmiCategory, calcBmi, describeBmi, healthyWeightRange } from './bmi';

describe('calcBmi', () => {
  it('делит вес на квадрат роста в метрах', () => {
    expect(calcBmi(85, 180)).toBeCloseTo(26.23, 2);
  });
});

describe('bmiCategory', () => {
  it('раскладывает по границам ВОЗ 18,5 / 25 / 30', () => {
    expect(bmiCategory(18.4)).toBe('underweight');
    expect(bmiCategory(18.5)).toBe('normal');
    expect(bmiCategory(24.9)).toBe('normal');
    expect(bmiCategory(25)).toBe('overweight');
    expect(bmiCategory(29.9)).toBe('overweight');
    expect(bmiCategory(30)).toBe('obese');
  });
});

describe('healthyWeightRange', () => {
  it('переводит нормальный ИМТ в килограммы для роста', () => {
    expect(healthyWeightRange(180)).toEqual({ min: 60, max: 81 });
  });
});

describe('describeBmi', () => {
  it('называет ИМТ, категорию и нормальный вес для роста', () => {
    expect(describeBmi({ birthDate: yearsBefore(toDateKey(), 30), heightCm: 180, weightKg: 85 })).toBe('ИМТ 26,2 — избыточный вес, норма для 180 см: 60–81 кг');
  });

  it('до 18 лет не ставит взрослую категорию', () => {
    const text = describeBmi({ birthDate: yearsBefore(toDateKey(), 16), heightCm: 170, weightKg: 60 });

    expect(text).toContain('ИМТ 20,8');
    expect(text).not.toContain('норма для');
  });
});
