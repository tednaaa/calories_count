import type { CalcInput } from './calories';
import { calcBmr, calcTarget, calcTdee, calibrateTarget, isWithinLimits, SAFE_MINIMUM_KCAL } from './calories';

const man: CalcInput = {
  sex: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 85,
  activity: 'moderate',
  goal: 'cutMild',
};

describe('calcBmr', () => {
  it('считает по Mifflin-St Jeor для мужчин', () => {
    expect(calcBmr(man)).toBe(1830);
  });

  it('считает по Mifflin-St Jeor для женщин', () => {
    expect(calcBmr({ sex: 'female', age: 30, heightCm: 165, weightKg: 60 })).toBe(1320.25);
  });

  it('разница между полами — константа формулы', () => {
    const measurements = { age: 30, heightCm: 170, weightKg: 70 };

    expect(calcBmr({ ...measurements, sex: 'male' }) - calcBmr({ ...measurements, sex: 'female' })).toBe(166);
  });
});

describe('calcTdee', () => {
  it('умножает базовый обмен на коэффициент активности', () => {
    expect(calcTdee(man)).toBeCloseTo(1830 * 1.55, 5);
  });

  it('растёт вместе с активностью', () => {
    const sedentary = calcTdee({ ...man, activity: 'sedentary' });
    const veryHigh = calcTdee({ ...man, activity: 'veryHigh' });

    expect(veryHigh).toBeGreaterThan(sedentary);
  });
});

describe('calcTarget', () => {
  it('применяет поправку цели и округляет до десятков', () => {
    expect(calcTarget(man).target).toBe(2410);
  });

  it('поддержание веса равно полному расходу', () => {
    const { target, tdee } = calcTarget({ ...man, goal: 'maintain' });

    expect(target).toBe(Math.round(tdee / 10) * 10);
  });

  it('дефицит ниже поддержания, профицит выше', () => {
    const maintain = calcTarget({ ...man, goal: 'maintain' }).target;

    expect(calcTarget({ ...man, goal: 'cut' }).target).toBeLessThan(maintain);
    expect(calcTarget({ ...man, goal: 'bulk' }).target).toBeGreaterThan(maintain);
  });

  it('всегда кратно десяти', () => {
    expect(calcTarget(man).target % 10).toBe(0);
  });

  it('не опускается ниже безопасного минимума', () => {
    const light = calcTarget({
      sex: 'female',
      age: 30,
      heightCm: 150,
      weightKg: 45,
      activity: 'sedentary',
      goal: 'cut',
    });

    expect(light.raw).toBeLessThan(SAFE_MINIMUM_KCAL.female);
    expect(light.target).toBe(SAFE_MINIMUM_KCAL.female);
    expect(light.clampedToMinimum).toBe(true);
  });

  it('не помечает обычный расчёт как упёршийся в минимум', () => {
    expect(calcTarget(man).clampedToMinimum).toBe(false);
  });
});

describe('isWithinLimits', () => {
  it('пропускает обычные значения', () => {
    expect(isWithinLimits(man)).toBe(true);
  });

  it('отсекает выход за границы', () => {
    expect(isWithinLimits({ ...man, age: 12 })).toBe(false);
    expect(isWithinLimits({ ...man, heightCm: 250 })).toBe(false);
    expect(isWithinLimits({ ...man, weightKg: 15 })).toBe(false);
  });
});

describe('calibrateTarget', () => {
  const profile = { ...man, targetKcal: 2410 };

  it('считает норму под цель от реального расхода', () => {
    expect(calibrateTarget(profile, 2620)).toMatchObject({ ideal: 2230, next: 2230 });
  });

  it('сдвигает норму за раз не больше чем на 250 ккал', () => {
    expect(calibrateTarget(profile, 2200)).toMatchObject({ ideal: 1870, next: 2160 });
    expect(calibrateTarget(profile, 3500)).toMatchObject({ ideal: 2980, next: 2660 });
  });

  it('выражает уточнение поправкой к расходу, а не готовой нормой', () => {
    const { next, tdeeCorrectionKcal } = calibrateTarget(profile, 2620);

    expect(tdeeCorrectionKcal).toBe(Math.round(2620 - calcTdee(man)));
    expect(calcTarget({ ...man, tdeeCorrectionKcal }).target).toBe(next);
  });

  it('не опускает норму ниже безопасного минимума', () => {
    const woman = { ...man, sex: 'female', weightKg: 60, goal: 'cut', targetKcal: 1300 } as const;

    expect(calibrateTarget(woman, 1400)).toMatchObject({ ideal: 1200, next: 1200 });
  });
});
