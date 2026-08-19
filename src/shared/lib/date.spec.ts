import {
  formatDayLabel,
  formatWeekday,
  fromDateKey,
  isFuture,
  isToday,
  lastDateKeys,
  shiftDateKey,
  toDateKey,
} from './date';

describe('toDateKey', () => {
  it('форматирует дату по локальному времени', () => {
    expect(toDateKey(new Date(2026, 7, 19, 12, 0))).toBe('2026-08-19');
  });

  it('дополняет месяц и день нулями', () => {
    expect(toDateKey(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });

  it('не уезжает на следующий день поздним вечером', () => {
    expect(toDateKey(new Date(2026, 7, 19, 23, 59))).toBe('2026-08-19');
  });

  it('не уезжает на предыдущий день ранним утром', () => {
    expect(toDateKey(new Date(2026, 7, 19, 0, 1))).toBe('2026-08-19');
  });
});

describe('fromDateKey', () => {
  it('разбирает ключ в локальную полночь', () => {
    const date = fromDateKey('2026-08-19');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(19);
    expect(date.getHours()).toBe(0);
  });

  it('обратен toDateKey', () => {
    expect(toDateKey(fromDateKey('2026-02-28'))).toBe('2026-02-28');
  });
});

describe('shiftDateKey', () => {
  it('сдвигает вперёд и назад', () => {
    expect(shiftDateKey('2026-08-19', 1)).toBe('2026-08-20');
    expect(shiftDateKey('2026-08-19', -1)).toBe('2026-08-18');
  });

  it('переходит через границу месяца', () => {
    expect(shiftDateKey('2026-08-31', 1)).toBe('2026-09-01');
    expect(shiftDateKey('2026-09-01', -1)).toBe('2026-08-31');
  });

  it('переходит через границу года', () => {
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('учитывает високосный год', () => {
    expect(shiftDateKey('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDateKey('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('isToday / isFuture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 19, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('распознаёт сегодня', () => {
    expect(isToday('2026-08-19')).toBe(true);
    expect(isToday('2026-08-18')).toBe(false);
  });

  it('распознаёт будущее', () => {
    expect(isFuture('2026-08-20')).toBe(true);
    expect(isFuture('2026-08-19')).toBe(false);
    expect(isFuture('2026-08-18')).toBe(false);
  });
});

describe('lastDateKeys', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 19, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('возвращает окно от старого к новому, включая сегодня', () => {
    expect(lastDateKeys(3)).toEqual(['2026-08-17', '2026-08-18', '2026-08-19']);
  });

  it('строит неделю из семи дней', () => {
    expect(lastDateKeys(7)).toHaveLength(7);
    expect(lastDateKeys(7).at(-1)).toBe('2026-08-19');
  });

  it('принимает произвольную конечную дату', () => {
    expect(lastDateKeys(2, '2026-01-01')).toEqual(['2025-12-31', '2026-01-01']);
  });
});

describe('formatDayLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 19, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('называет сегодня и вчера словами', () => {
    expect(formatDayLabel('2026-08-19')).toBe('Сегодня');
    expect(formatDayLabel('2026-08-18')).toBe('Вчера');
  });

  it('остальные дни — числом и месяцем', () => {
    expect(formatDayLabel('2026-08-17')).toContain('17');
    expect(formatDayLabel('2026-08-17')).toContain('август');
  });
});

describe('formatWeekday', () => {
  it('возвращает короткое название дня недели', () => {
    // 19 августа 2026 — среда
    expect(formatWeekday('2026-08-19').toLowerCase()).toContain('ср');
  });
});
