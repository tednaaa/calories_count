export type DateKey = string;

export function toDateKey(date: Date = new Date()): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function shiftDateKey(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === 'string'
    && DATE_KEY_PATTERN.test(value)
    && toDateKey(fromDateKey(value)) === value;
}

export function isToday(key: DateKey): boolean {
  return key === toDateKey();
}

export function isFuture(key: DateKey): boolean {
  return key > toDateKey();
}

export function requestedDateKey(value: unknown): DateKey {
  return isDateKey(value) && !isFuture(value) ? value : toDateKey();
}

export function lastDateKeys(count: number, until: DateKey = toDateKey()): DateKey[] {
  return Array.from({ length: count }, (_, index) => shiftDateKey(until, index - count + 1));
}

const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

export function formatDayLabel(key: DateKey): string {
  if (isToday(key)) {
    return 'Сегодня';
  }
  if (key === shiftDateKey(toDateKey(), -1)) {
    return 'Вчера';
  }

  return dayMonthFormatter.format(fromDateKey(key));
}

export function formatWeekday(key: DateKey): string {
  return weekdayFormatter.format(fromDateKey(key));
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

export function formatTime(epochMs: number): string {
  return timeFormatter.format(new Date(epochMs));
}
