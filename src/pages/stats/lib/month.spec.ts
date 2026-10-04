import {
  calendarWeeks,
  dayTotals,
  endOfMonth,
  formatDeviation,
  formatMonth,
  judgeDay,
  monthDateKeys,
  requestedMonth,
  shiftMonth,
  startOfMonth,
  summarizeDays,
} from './month';

describe('month bounds', () => {
  it('start of month is the first day', () => {
    expect(startOfMonth('2026-10-17')).toBe('2026-10-01');
  });

  it('end of month respects length and leap February', () => {
    expect(endOfMonth('2026-09-01')).toBe('2026-09-30');
    expect(endOfMonth('2028-02-01')).toBe('2028-02-29');
  });

  it('shifts across the year boundary', () => {
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
  });

  it('lists every day of the month', () => {
    const days = monthDateKeys('2026-02-01');

    expect(days).toHaveLength(28);
    expect(days.at(-1)).toBe('2026-02-28');
  });
});

describe('requestedMonth', () => {
  it('accepts a past month from the URL', () => {
    expect(requestedMonth('2026-08', '2026-10-03')).toBe('2026-08-01');
  });

  it('replaces a future month with the current one', () => {
    expect(requestedMonth('2026-11', '2026-10-03')).toBe('2026-10-01');
  });

  it('replaces garbage in the URL with the current month', () => {
    expect(requestedMonth('2026-13', '2026-10-03')).toBe('2026-10-01');
    expect(requestedMonth(undefined, '2026-10-03')).toBe('2026-10-01');
  });
});

describe('calendarWeeks', () => {
  it('starts weeks on Monday with blank cells before the first day', () => {
    const [first] = calendarWeeks('2026-10-01');

    expect(first).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  });

  it('keeps the last days when the month starts on Sunday', () => {
    const weeks = calendarWeeks('2026-03-01');

    expect(weeks).toHaveLength(6);
    expect(weeks.at(-1)).toEqual(['2026-03-30', '2026-03-31', null, null, null, null, null]);
  });

  it('fits a month of exactly four weeks into four rows', () => {
    expect(calendarWeeks('2027-02-01')).toHaveLength(4);
  });
});

describe('judgeDay', () => {
  const cutting = { target: 2400, goal: 'cutMild', isToday: false } as const;
  const bulking = { target: 2800, goal: 'bulk', isToday: false } as const;

  it('marks a day without entries as empty', () => {
    expect(judgeDay(0, cutting)).toBe('empty');
  });

  it('tolerates overshoot within 5 % of target', () => {
    expect(judgeDay(2510, cutting)).toBe('onTrack');
    expect(judgeDay(2530, cutting)).toBe('offTrack');
  });

  it('flags undershoot, not overshoot, when bulking', () => {
    expect(judgeDay(3500, bulking)).toBe('onTrack');
    expect(judgeDay(2000, bulking)).toBe('offTrack');
  });

  it('does not flag unfinished today when bulking', () => {
    expect(judgeDay(1200, { ...bulking, isToday: true })).toBe('onTrack');
  });
});

describe('dayTotals', () => {
  it('shows a day without entries as zero', () => {
    expect(dayTotals(['2026-08-17', '2026-08-18'], new Map([['2026-08-18', 2000]]))).toEqual([
      { date: '2026-08-17', kcal: 0 },
      { date: '2026-08-18', kcal: 2000 },
    ]);
  });
});

describe('summarizeDays', () => {
  it('averages only over tracked days', () => {
    const days = [
      { date: '2026-08-17', kcal: 2000 },
      { date: '2026-08-18', kcal: 0 },
      { date: '2026-08-19', kcal: 3000 },
    ];

    expect(summarizeDays(days, 2400)).toMatchObject({ average: 2500, trackedDays: 2, total: 5000 });
  });

  it('compares with target only over tracked days', () => {
    const days = [
      { date: '2026-08-17', kcal: 2000 },
      { date: '2026-08-18', kcal: 0 },
    ];

    expect(summarizeDays(days, 2400).deviation).toBe(-400);
  });

  it('does not divide by zero on an empty month', () => {
    const days = [{ date: '2026-08-17', kcal: 0 }];

    expect(summarizeDays(days, 2400)).toEqual({ total: 0, average: 0, trackedDays: 0, deviation: 0 });
  });
});

describe('formatMonth', () => {
  it('writes capitalized month and year', () => {
    expect(formatMonth('2026-10-01')).toBe('Октябрь 2026');
  });
});

describe('formatDeviation', () => {
  it('converts deficit to kilograms', () => {
    expect(formatDeviation(-3500)).toBe('дефицит 3 500 ккал ≈ 0,45 кг');
  });

  it('converts surplus to kilograms', () => {
    expect(formatDeviation(7700)).toBe('профицит 7 700 ккал ≈ 1,00 кг');
  });

  it('describes an exact hit in words', () => {
    expect(formatDeviation(0)).toBe('ровно по цели');
  });
});
