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

describe('границы месяца', () => {
  it('начало месяца — первое число', () => {
    expect(startOfMonth('2026-10-17')).toBe('2026-10-01');
  });

  it('конец месяца учитывает длину и високосный февраль', () => {
    expect(endOfMonth('2026-09-01')).toBe('2026-09-30');
    expect(endOfMonth('2028-02-01')).toBe('2028-02-29');
  });

  it('листает через границу года', () => {
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
  });

  it('перечисляет все дни месяца', () => {
    const days = monthDateKeys('2026-02-01');

    expect(days).toHaveLength(28);
    expect(days.at(-1)).toBe('2026-02-28');
  });
});

describe('requestedMonth', () => {
  it('принимает прошлый месяц из адреса', () => {
    expect(requestedMonth('2026-08', '2026-10-03')).toBe('2026-08-01');
  });

  it('будущий месяц заменяет текущим', () => {
    expect(requestedMonth('2026-11', '2026-10-03')).toBe('2026-10-01');
  });

  it('мусор в адресе заменяет текущим', () => {
    expect(requestedMonth('2026-13', '2026-10-03')).toBe('2026-10-01');
    expect(requestedMonth(undefined, '2026-10-03')).toBe('2026-10-01');
  });
});

describe('calendarWeeks', () => {
  it('начинает неделю с понедельника и оставляет пустые клетки до первого числа', () => {
    const [first] = calendarWeeks('2026-10-01');

    expect(first).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  });

  it('не теряет последние дни, когда месяц начинается в воскресенье', () => {
    const weeks = calendarWeeks('2026-03-01');

    expect(weeks).toHaveLength(6);
    expect(weeks.at(-1)).toEqual(['2026-03-30', '2026-03-31', null, null, null, null, null]);
  });

  it('месяц ровно из четырёх недель занимает четыре строки', () => {
    expect(calendarWeeks('2027-02-01')).toHaveLength(4);
  });
});

describe('judgeDay', () => {
  const cutting = { target: 2400, goal: 'cutMild', isToday: false } as const;
  const bulking = { target: 2800, goal: 'bulk', isToday: false } as const;

  it('день без записей пустой', () => {
    expect(judgeDay(0, cutting)).toBe('empty');
  });

  it('прощает перебор в пределах 5 % нормы', () => {
    expect(judgeDay(2510, cutting)).toBe('onTrack');
    expect(judgeDay(2530, cutting)).toBe('offTrack');
  });

  it('при наборе отмечает недобор, а не перебор', () => {
    expect(judgeDay(3500, bulking)).toBe('onTrack');
    expect(judgeDay(2000, bulking)).toBe('offTrack');
  });

  it('при наборе не ругает сегодняшний, ещё не законченный день', () => {
    expect(judgeDay(1200, { ...bulking, isToday: true })).toBe('onTrack');
  });
});

describe('dayTotals', () => {
  it('день без записей показывает нулём', () => {
    expect(dayTotals(['2026-08-17', '2026-08-18'], new Map([['2026-08-18', 2000]]))).toEqual([
      { date: '2026-08-17', kcal: 0 },
      { date: '2026-08-18', kcal: 2000 },
    ]);
  });
});

describe('summarizeDays', () => {
  it('считает среднее только по дням с записями', () => {
    const days = [
      { date: '2026-08-17', kcal: 2000 },
      { date: '2026-08-18', kcal: 0 },
      { date: '2026-08-19', kcal: 3000 },
    ];

    expect(summarizeDays(days, 2400)).toMatchObject({ average: 2500, trackedDays: 2, total: 5000 });
  });

  it('сравнивает с целью только за дни с записями', () => {
    const days = [
      { date: '2026-08-17', kcal: 2000 },
      { date: '2026-08-18', kcal: 0 },
    ];

    expect(summarizeDays(days, 2400).deviation).toBe(-400);
  });

  it('на пустом месяце не делит на ноль', () => {
    const days = [{ date: '2026-08-17', kcal: 0 }];

    expect(summarizeDays(days, 2400)).toEqual({ total: 0, average: 0, trackedDays: 0, deviation: 0 });
  });
});

describe('formatMonth', () => {
  it('пишет месяц с заглавной и год', () => {
    expect(formatMonth('2026-10-01')).toBe('Октябрь 2026');
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
