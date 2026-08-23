import {
  dayNumber,
  formatDayLabel,
  formatFullDate,
  formatTime,
  formatWeekday,
  fromDateKey,
  isDateKey,
  isFuture,
  isToday,
  lastDateKeys,
  shiftDateKey,
  startOfWeek,
  toDateKey,
  weekDateKeys,
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

describe('isDateKey', () => {
  it('принимает ключ, полученный из toDateKey', () => {
    expect(isDateKey(toDateKey(new Date(2026, 7, 19)))).toBe(true);
  });

  it('отвергает несуществующий день', () => {
    expect(isDateKey('2026-02-30')).toBe(false);
  });

  it('отвергает чужой формат и мусор', () => {
    expect(isDateKey('19.08.2026')).toBe(false);
    expect(isDateKey('2026-8-19')).toBe(false);
    expect(isDateKey('завтра')).toBe(false);
  });

  it('отвергает всё, что не строка', () => {
    expect(isDateKey(undefined)).toBe(false);
    expect(isDateKey(null)).toBe(false);
    expect(isDateKey(['2026-08-19'])).toBe(false);
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

describe('startOfWeek', () => {
  it('отматывает к понедельнику этой недели', () => {
    expect(startOfWeek('2026-08-19')).toBe('2026-08-17');
  });

  it('оставляет понедельник на месте', () => {
    expect(startOfWeek('2026-08-17')).toBe('2026-08-17');
  });

  it('воскресенье относит к уходящей неделе', () => {
    expect(startOfWeek('2026-08-23')).toBe('2026-08-17');
  });
});

describe('weekDateKeys', () => {
  it('возвращает неделю с понедельника по воскресенье', () => {
    expect(weekDateKeys('2026-08-19')).toEqual([
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
      '2026-08-21',
      '2026-08-22',
      '2026-08-23',
    ]);
  });

  it('одинакова для любого дня одной недели', () => {
    expect(weekDateKeys('2026-08-17')).toEqual(weekDateKeys('2026-08-23'));
  });

  it('переходит через границу месяца', () => {
    expect(weekDateKeys('2026-09-01')).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
  });
});

describe('dayNumber', () => {
  it('возвращает число месяца без ведущего нуля', () => {
    expect(dayNumber('2026-08-05')).toBe(5);
    expect(dayNumber('2026-08-19')).toBe(19);
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

describe('formatFullDate', () => {
  it('называет день недели, число и месяц', () => {
    const label = formatFullDate('2026-08-19');

    expect(label).toContain('среда');
    expect(label).toContain('19');
    expect(label).toContain('август');
  });
});

describe('formatTime', () => {
  it('показывает часы и минуты локального времени', () => {
    expect(formatTime(new Date(2026, 7, 19, 9, 5).getTime())).toBe('09:05');
  });

  it('использует 24-часовой формат', () => {
    expect(formatTime(new Date(2026, 7, 19, 21, 30).getTime())).toBe('21:30');
  });
});
