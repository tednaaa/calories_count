import { toDateKey, yearsBefore } from '@/shared/lib';
import { bmiCategory, calcBmi, describeBmi, healthyWeightRange } from './bmi';

describe('calcBmi', () => {
  it('divides weight by height in meters squared', () => {
    expect(calcBmi(85, 180)).toBeCloseTo(26.23, 2);
  });
});

describe('bmiCategory', () => {
  it('splits by WHO thresholds 18.5 / 25 / 30', () => {
    expect(bmiCategory(18.4)).toBe('underweight');
    expect(bmiCategory(18.5)).toBe('normal');
    expect(bmiCategory(24.9)).toBe('normal');
    expect(bmiCategory(25)).toBe('overweight');
    expect(bmiCategory(29.9)).toBe('overweight');
    expect(bmiCategory(30)).toBe('obese');
  });
});

describe('healthyWeightRange', () => {
  it('converts normal BMI to kilograms for the height', () => {
    expect(healthyWeightRange(180)).toEqual({ min: 60, max: 81 });
  });
});

describe('describeBmi', () => {
  it('names BMI, category and healthy weight for the height', () => {
    expect(describeBmi({ birthDate: yearsBefore(toDateKey(), 30), heightCm: 180, weightKg: 85 })).toBe('ИМТ 26,2 — избыточный вес, норма для 180 см: 60–81 кг');
  });

  it('skips the adult category under 18', () => {
    const text = describeBmi({ birthDate: yearsBefore(toDateKey(), 16), heightCm: 170, weightKg: 60 });

    expect(text).toContain('ИМТ 20,8');
    expect(text).not.toContain('норма для');
  });
});
