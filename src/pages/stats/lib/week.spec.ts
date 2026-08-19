import { chartScale, formatDeviation, summarizeWeek, weekTotals } from './week';

describe('weekTotals', () => {
  it('сохраняет порядок дней окна', () => {
    const totals = new Map([['2026-08-18', 2000]]);

    expect(weekTotals(['2026-08-17', '2026-08-18'], totals)).toEqual([
      { date: '2026-08-17', kcal: 0 },
      { date: '2026-08-18', kcal: 2000 },
    ]);
  });

  it('день без записей показывает нулём', () => {
    expect(weekTotals(['2026-08-17'], new Map())).toEqual([{ date: '2026-08-17', kcal: 0 }]);
  });
});

describe('summarizeWeek', () => {
  it('считает среднее только по дням с записями', () => {
    const days = [
      { date: '2026-08-17', kcal: 2000 },
      { date: '2026-08-18', kcal: 0 },
      { date: '2026-08-19', kcal: 3000 },
    ];

    expect(summarizeWeek(days, 2400)).toMatchObject({ average: 2500, trackedDays: 2, total: 5000 });
  });

  it('сравнивает с целью только за дни с записями', () => {
    const days = [
      { date: '2026-08-17', kcal: 2000 },
      { date: '2026-08-18', kcal: 0 },
    ];

    expect(summarizeWeek(days, 2400).deviation).toBe(-400);
  });

  it('на пустой неделе не делит на ноль', () => {
    const days = [{ date: '2026-08-17', kcal: 0 }];

    expect(summarizeWeek(days, 2400)).toEqual({ total: 0, average: 0, trackedDays: 0, deviation: 0 });
  });
});

describe('chartScale', () => {
  it('вмещает и цель, и самый высокий столбик', () => {
    expect(chartScale([{ date: '2026-08-17', kcal: 3200 }], 2400)).toBeGreaterThan(3200);
    expect(chartScale([{ date: '2026-08-17', kcal: 1200 }], 2400)).toBeGreaterThan(2400);
  });

  it('оставляет запас, чтобы линия цели не упиралась в верх', () => {
    const withoutOverruns = chartScale([{ date: '2026-08-17', kcal: 2000 }], 2400);

    expect(2400 / withoutOverruns).toBeLessThan(0.95);
  });

  it('без цели и записей не даёт нулевой масштаб', () => {
    expect(chartScale([], 0)).toBeGreaterThan(0);
  });
});

describe('formatDeviation', () => {
  it('переводит дефицит в килограммы', () => {
    expect(formatDeviation(-3500)).toBe('дефицит 3 500 ккал ≈ 0,45 кг');
  });

  it('переводит профицит в килограммы', () => {
    expect(formatDeviation(7700)).toBe('профицит 7 700 ккал ≈ 1,00 кг');
  });

  it('точное попадание описывает словами', () => {
    expect(formatDeviation(0)).toBe('ровно по цели');
  });
});
