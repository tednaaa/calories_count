import { effectScope } from 'vue';
import { useToday } from './today';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 3, 23, 59));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useToday', () => {
  it('переходит на новый день после полуночи без перезагрузки', () => {
    const scope = effectScope();
    const today = scope.run(() => useToday())!;

    expect(today.value).toBe('2026-10-03');

    vi.advanceTimersByTime(2 * 60_000);

    expect(today.value).toBe('2026-10-04');
    scope.stop();
  });
});
