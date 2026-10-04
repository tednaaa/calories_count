import type { CalcInput } from './calories';
import { toDateKey, yearsBefore } from '@/shared/lib';
import { calcBmr, calcTarget, calcTdee, calibrateTarget, isWithinLimits, SAFE_MINIMUM_KCAL } from './calories';

const man: CalcInput = {
  sex: 'male',
  birthDate: yearsBefore(toDateKey(), 30),
  heightCm: 180,
  weightKg: 85,
  activity: 'moderate',
  goal: 'cutMild',
};

describe('calcBmr', () => {
  it('applies Mifflin-St Jeor for men', () => {
    expect(calcBmr(man)).toBe(1830);
  });

  it('applies Mifflin-St Jeor for women', () => {
    expect(calcBmr({ sex: 'female', birthDate: yearsBefore(toDateKey(), 30), heightCm: 165, weightKg: 60 })).toBe(1320.25);
  });

  it('differs between sexes by the formula constant', () => {
    const measurements = { birthDate: yearsBefore(toDateKey(), 30), heightCm: 170, weightKg: 70 };

    expect(calcBmr({ ...measurements, sex: 'male' }) - calcBmr({ ...measurements, sex: 'female' })).toBe(166);
  });
});

describe('calcTdee', () => {
  it('multiplies BMR by the activity factor', () => {
    expect(calcTdee(man)).toBeCloseTo(1830 * 1.55, 5);
  });

  it('grows with activity', () => {
    const sedentary = calcTdee({ ...man, activity: 'sedentary' });
    const veryHigh = calcTdee({ ...man, activity: 'veryHigh' });

    expect(veryHigh).toBeGreaterThan(sedentary);
  });
});

describe('calcTarget', () => {
  it('applies the goal adjustment and rounds to tens', () => {
    expect(calcTarget(man).target).toBe(2410);
  });

  it('equals full expenditure when maintaining weight', () => {
    const { target, tdee } = calcTarget({ ...man, goal: 'maintain' });

    expect(target).toBe(Math.round(tdee / 10) * 10);
  });

  it('puts deficit below maintenance and surplus above', () => {
    const maintain = calcTarget({ ...man, goal: 'maintain' }).target;

    expect(calcTarget({ ...man, goal: 'cut' }).target).toBeLessThan(maintain);
    expect(calcTarget({ ...man, goal: 'bulk' }).target).toBeGreaterThan(maintain);
  });

  it('does not drop below the safe minimum', () => {
    const light = calcTarget({
      sex: 'female',
      birthDate: yearsBefore(toDateKey(), 30),
      heightCm: 150,
      weightKg: 45,
      activity: 'sedentary',
      goal: 'cut',
    });

    expect(light.raw).toBeLessThan(SAFE_MINIMUM_KCAL.female);
    expect(light.target).toBe(SAFE_MINIMUM_KCAL.female);
    expect(light.clampedToMinimum).toBe(true);
  });

  it('does not flag a regular result as clamped to the minimum', () => {
    expect(calcTarget(man).clampedToMinimum).toBe(false);
  });
});

describe('isWithinLimits', () => {
  it('accepts regular values', () => {
    expect(isWithinLimits(man)).toBe(true);
  });

  it('rejects out-of-range values', () => {
    expect(isWithinLimits({ ...man, birthDate: yearsBefore(toDateKey(), 12) })).toBe(false);
    expect(isWithinLimits({ ...man, heightCm: 250 })).toBe(false);
    expect(isWithinLimits({ ...man, weightKg: 15 })).toBe(false);
  });
});

describe('calibrateTarget', () => {
  const profile = { ...man, targetKcal: 2410 };

  it('computes the goal target from real expenditure', () => {
    expect(calibrateTarget(profile, 2620)).toMatchObject({ ideal: 2230, next: 2230 });
  });

  it('shifts the target by at most 250 kcal at a time', () => {
    expect(calibrateTarget(profile, 2200)).toMatchObject({ ideal: 1870, next: 2160 });
    expect(calibrateTarget(profile, 3500)).toMatchObject({ ideal: 2980, next: 2660 });
  });

  it('expresses calibration as an expenditure correction, not a fixed target', () => {
    const { next, tdeeCorrectionKcal } = calibrateTarget(profile, 2620);

    expect(tdeeCorrectionKcal).toBe(Math.round(2620 - calcTdee(man)));
    expect(calcTarget({ ...man, tdeeCorrectionKcal }).target).toBe(next);
  });

  it('does not lower the target below the safe minimum', () => {
    const woman = { ...man, sex: 'female', weightKg: 60, goal: 'cut', targetKcal: 1300 } as const;

    expect(calibrateTarget(woman, 1400)).toMatchObject({ ideal: 1200, next: 1200 });
  });
});
