import {
  daysBetween,
  formatDayLabel,
  fromDateKey,
  fullYearsBetween,
  isDateKey,
  isFuture,
  isToday,
  lastDateKeys,
  shiftDateKey,
  startOfWeek,
  toDateKey,
  weekDateKeys,
  yearsBefore,
} from './date';

describe('toDateKey', () => {
  it('formats the date in local time', () => {
    expect(toDateKey(new Date(2026, 7, 19, 12, 0))).toBe('2026-08-19');
  });

  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });

  it('stays on the same day late in the evening', () => {
    expect(toDateKey(new Date(2026, 7, 19, 23, 59))).toBe('2026-08-19');
  });

  it('stays on the same day early in the morning', () => {
    expect(toDateKey(new Date(2026, 7, 19, 0, 1))).toBe('2026-08-19');
  });
});

describe('fromDateKey', () => {
  it('parses the key to local midnight', () => {
    const date = fromDateKey('2026-08-19');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(19);
    expect(date.getHours()).toBe(0);
  });

  it('is the inverse of toDateKey', () => {
    expect(toDateKey(fromDateKey('2026-02-28'))).toBe('2026-02-28');
  });
});

describe('shiftDateKey', () => {
  it('shifts forward and backward', () => {
    expect(shiftDateKey('2026-08-19', 1)).toBe('2026-08-20');
    expect(shiftDateKey('2026-08-19', -1)).toBe('2026-08-18');
  });

  it('crosses a month boundary', () => {
    expect(shiftDateKey('2026-08-31', 1)).toBe('2026-09-01');
    expect(shiftDateKey('2026-09-01', -1)).toBe('2026-08-31');
  });

  it('crosses a year boundary', () => {
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('isDateKey', () => {
  it('accepts a key produced by toDateKey', () => {
    expect(isDateKey(toDateKey(new Date(2026, 7, 19)))).toBe(true);
  });

  it('rejects a nonexistent day', () => {
    expect(isDateKey('2026-02-30')).toBe(false);
  });

  it('rejects other formats and garbage', () => {
    expect(isDateKey('19.08.2026')).toBe(false);
    expect(isDateKey('2026-8-19')).toBe(false);
    expect(isDateKey('завтра')).toBe(false);
  });

  it('rejects non-strings', () => {
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

  it('detects today', () => {
    expect(isToday('2026-08-19')).toBe(true);
    expect(isToday('2026-08-18')).toBe(false);
  });

  it('detects the future', () => {
    expect(isFuture('2026-08-20')).toBe(true);
    expect(isFuture('2026-08-19')).toBe(false);
    expect(isFuture('2026-08-18')).toBe(false);
  });
});

describe('startOfWeek', () => {
  it('rewinds to Monday of this week', () => {
    expect(startOfWeek('2026-08-19')).toBe('2026-08-17');
  });

  it('keeps Monday as is', () => {
    expect(startOfWeek('2026-08-17')).toBe('2026-08-17');
  });

  it('assigns Sunday to the ending week', () => {
    expect(startOfWeek('2026-08-23')).toBe('2026-08-17');
  });
});

describe('weekDateKeys', () => {
  it('returns the week from Monday to Sunday', () => {
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

  it('is the same for any day of the week', () => {
    expect(weekDateKeys('2026-08-17')).toEqual(weekDateKeys('2026-08-23'));
  });

  it('crosses a month boundary', () => {
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

describe('lastDateKeys', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 19, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the window oldest first, including today', () => {
    expect(lastDateKeys(3)).toEqual(['2026-08-17', '2026-08-18', '2026-08-19']);
  });

  it('accepts a custom end date', () => {
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

  it('names today and yesterday in words', () => {
    expect(formatDayLabel('2026-08-19')).toBe('Сегодня');
    expect(formatDayLabel('2026-08-18')).toBe('Вчера');
  });

  it('shows other days as day and month', () => {
    expect(formatDayLabel('2026-08-17')).toContain('17');
    expect(formatDayLabel('2026-08-17')).toContain('август');
  });
});

describe('daysBetween', () => {
  it('counts calendar days between dates', () => {
    expect(daysBetween('2026-09-28', '2026-10-03')).toBe(5);
  });

  it('returns zero for the same date and negative for reverse order', () => {
    expect(daysBetween('2026-10-03', '2026-10-03')).toBe(0);
    expect(daysBetween('2026-10-03', '2026-10-01')).toBe(-2);
  });

  it('stays correct across the DST change', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('fullYearsBetween', () => {
  it('counts only full years', () => {
    expect(fullYearsBetween('1996-10-04', '2026-10-04')).toBe(30);
    expect(fullYearsBetween('1996-10-05', '2026-10-04')).toBe(29);
    expect(fullYearsBetween('1996-12-31', '2026-01-01')).toBe(29);
  });
});

describe('yearsBefore', () => {
  it('steps back by whole years', () => {
    expect(yearsBefore('2026-10-04', 30)).toBe('1996-10-04');
  });

  it('moves February 29 to March 1 in a non-leap year', () => {
    expect(yearsBefore('2028-02-29', 1)).toBe('2027-03-01');
  });
});
