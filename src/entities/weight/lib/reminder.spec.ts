import type { ReminderState } from './reminder';
import { shouldRemindWeighIn } from './reminder';

function state(overrides: Partial<ReminderState> = {}): ReminderState {
  return { lastDate: '2026-10-01', today: '2026-10-03', postponedOn: '', enabled: true, ...overrides };
}

describe('shouldRemindWeighIn', () => {
  it('напоминает, если последний замер был позавчера или раньше', () => {
    expect(shouldRemindWeighIn(state())).toBe(true);
    expect(shouldRemindWeighIn(state({ lastDate: '2026-09-20' }))).toBe(true);
  });

  it('напоминает, если взвешиваний ещё не было', () => {
    expect(shouldRemindWeighIn(state({ lastDate: undefined }))).toBe(true);
  });

  it('молчит, если вес сегодня уже записан', () => {
    expect(shouldRemindWeighIn(state({ lastDate: '2026-10-03' }))).toBe(false);
  });

  it('молчит, если замер был вчера', () => {
    expect(shouldRemindWeighIn(state({ lastDate: '2026-10-02' }))).toBe(false);
  });

  it('молчит до завтра после «Взвешусь завтра»', () => {
    expect(shouldRemindWeighIn(state({ postponedOn: '2026-10-03' }))).toBe(false);
    expect(shouldRemindWeighIn(state({ postponedOn: '2026-10-02' }))).toBe(true);
  });

  it('молчит, если напоминание выключено в настройках', () => {
    expect(shouldRemindWeighIn(state({ enabled: false }))).toBe(false);
  });
});
