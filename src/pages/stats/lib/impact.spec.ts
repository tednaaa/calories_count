import type { ImpactInput, WeightPoint } from './impact';
import type { WeightRecord } from '@/shared/db';
import { lastDateKeys } from '@/shared/lib';
import { analyzeImpact, evenSpreadError, fitTrend, formatKcal, formatRate, IMPACT_WINDOW_DAYS, toPoints } from './impact';

const days = lastDateKeys(IMPACT_WINDOW_DAYS, '2026-10-28');

function weighIns(dayIndexes: number[], kgAt: (day: number) => number): WeightRecord[] {
  return dayIndexes.map(day => ({ date: days[day], kg: kgAt(day), createdAt: 0 }));
}

function eaten(kcal: number, dayIndexes: number[] = days.map((_, index) => index)): Map<string, number> {
  return new Map(dayIndexes.map(day => [days[day], kcal]));
}

function input(overrides: Partial<ImpactInput> = {}): ImpactInput {
  return {
    days,
    totals: eaten(2400),
    weights: weighIns([0, 3, 7, 10, 14, 17, 21, 24, 27], day => 86 - day * 0.2 / 7),
    formulaTdee: 2840,
    ...overrides,
  };
}

function ready(overrides: Partial<ImpactInput> = {}) {
  const result = analyzeImpact(input(overrides));

  if (!result.ready) {
    throw new Error('ожидался готовый вывод');
  }

  return result.impact;
}

describe('fitTrend', () => {
  it('находит наклон ровного ряда', () => {
    const points: WeightPoint[] = [{ day: 0, kg: 86 }, { day: 7, kg: 85.8 }, { day: 14, kg: 85.6 }];

    expect(fitTrend(points)?.slope).toBeCloseTo(-0.2 / 7);
  });

  it('не строит тренд по одной точке и по одному дню', () => {
    expect(fitTrend([{ day: 3, kg: 85 }])).toBeNull();
    expect(fitTrend([{ day: 3, kg: 85 }, { day: 3, kg: 86 }])).toBeNull();
  });

  it('при малом числе замеров берёт типичный разброс веса', () => {
    expect(fitTrend([{ day: 0, kg: 86 }, { day: 14, kg: 85.6 }])?.noise).toBe(0.7);
  });

  it('не опускает разброс ниже полукилограмма даже на идеальной прямой', () => {
    const points = [0, 4, 8, 12, 16, 20].map(day => ({ day, kg: 86 - day * 0.03 }));

    expect(fitTrend(points)?.noise).toBe(0.5);
  });

  it('меряет разброс по отклонениям от линии, когда замеров хватает', () => {
    const points = [0, 4, 8, 12, 16, 20].map((day, index) => ({ day, kg: 86 + (index % 2 ? 1.2 : -1.2) }));

    expect(fitTrend(points)?.noise).toBeGreaterThan(1);
  });
});

describe('погрешность наклона', () => {
  it('падает с числом замеров', () => {
    expect(evenSpreadError(0.7, 12, 28)).toBeLessThan(evenSpreadError(0.7, 8, 28));
    expect(evenSpreadError(0.7, 28, 28)).toBeLessThan(evenSpreadError(0.7, 12, 28));
  });

  it('при 2–3 замерах в неделю даёт около ±200 ккал', () => {
    expect(evenSpreadError(0.7, 12, 28) * 7700).toBeCloseTo(190, -1);
  });

  it('замеры кучкой в начале окна точнее не делают', () => {
    const bunched = [0, 1, 2, 3, 4, 5, 6, 27].map(day => ({ day, kg: 86 }));
    const spread = [0, 4, 8, 12, 16, 20, 24, 27].map(day => ({ day, kg: 86 }));

    expect(fitTrend(bunched)!.slopeError).toBeGreaterThan(fitTrend(spread)!.slopeError);
  });
});

describe('toPoints', () => {
  it('считает дни от начала окна и отбрасывает замеры за его пределами', () => {
    const records: WeightRecord[] = [
      { date: '2026-09-20', kg: 90, createdAt: 0 },
      { date: days[0], kg: 86, createdAt: 0 },
      { date: days[5], kg: 85.8, createdAt: 0 },
    ];

    expect(toPoints(records, days)).toEqual([{ day: 0, kg: 86 }, { day: 5, kg: 85.8 }]);
  });
});

describe('analyzeImpact', () => {
  it('сравнивает ожидаемый по еде темп с фактическим', () => {
    const impact = ready();

    expect(impact.expectedPerWeek).toBeCloseTo(-0.4, 2);
    expect(impact.actualPerWeek).toBeCloseTo(-0.2, 2);
  });

  it('выводит реальный расход из съеденного и наклона веса', () => {
    expect(ready().realTdee).toBeCloseTo(2620, 0);
  });

  it('не считает сегодняшний, ещё не законченный день', () => {
    const impact = ready({ totals: new Map([...eaten(2400), [days[27], 300]]) });

    expect(impact.averageIntake).toBe(2400);
    expect(impact.countedDays).toBe(27);
  });

  it('пропуски в записях еды не считаются голодовкой', () => {
    const impact = ready({ totals: eaten(2400, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]) });

    expect(impact.averageIntake).toBe(2400);
    expect(impact.trackedDays).toBe(14);
  });

  it('показывает покрытие ниже 70 %, когда еда записана не за все дни', () => {
    const impact = ready({ totals: eaten(2400, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]) });

    expect(impact.coverage).toBeCloseTo(14 / 27);
  });

  it('обещает точность лучше при ещё четырёх замерах', () => {
    const impact = ready();

    expect(impact.projection?.weighIns).toBe(13);
    expect(impact.projection!.error).toBeLessThan(impact.realTdeeError);
  });

  it('не выдаёт вывод при двух замерах', () => {
    const result = analyzeImpact(input({ weights: weighIns([0, 20], () => 86) }));

    expect(result).toEqual({ ready: false, shortfall: { weighIns: 1, spanDays: 0, trackedDays: 0 } });
  });

  it('не выдаёт вывод, если замеры уложились в неделю', () => {
    const result = analyzeImpact(input({ weights: weighIns([20, 23, 27], () => 86) }));

    expect(result).toEqual({ ready: false, shortfall: { weighIns: 0, spanDays: 7, trackedDays: 0 } });
  });

  it('не выдаёт вывод при малом числе дней с едой', () => {
    const result = analyzeImpact(input({ totals: eaten(2400, [0, 1, 2, 3, 4]) }));

    expect(result).toEqual({ ready: false, shortfall: { weighIns: 0, spanDays: 0, trackedDays: 9 } });
  });

  it('на пустых данных называет всё, чего не хватает', () => {
    const result = analyzeImpact(input({ weights: [], totals: new Map() }));

    expect(result).toEqual({ ready: false, shortfall: { weighIns: 3, spanDays: 14, trackedDays: 14 } });
  });
});

describe('форматирование', () => {
  it('пишет темп со знаком и запятой', () => {
    expect(formatRate(-0.2)).toBe('−0,20 кг/нед');
    expect(formatRate(0.35)).toBe('+0,35 кг/нед');
    expect(formatRate(0.001)).toBe('0,00 кг/нед');
  });

  it('округляет калории до десятков', () => {
    expect(formatKcal(2617.4)).toBe('2 620');
  });
});
