import type { ReminderState } from './reminder';
import { shouldRemindWeighIn } from './reminder';

function state(overrides: Partial<ReminderState> = {}): ReminderState {
	return { lastDate: '2026-10-01', today: '2026-10-03', postponedOn: '', enabled: true, ...overrides };
}

describe('shouldRemindWeighIn', () => {
	it('reminds when the last weigh-in was two or more days ago', () => {
		expect(shouldRemindWeighIn(state())).toBe(true);
		expect(shouldRemindWeighIn(state({ lastDate: '2026-09-20' }))).toBe(true);
	});

	it('reminds when there are no weigh-ins yet', () => {
		expect(shouldRemindWeighIn(state({ lastDate: undefined }))).toBe(true);
	});

	it('stays silent when weight is already recorded today', () => {
		expect(shouldRemindWeighIn(state({ lastDate: '2026-10-03' }))).toBe(false);
	});

	it('stays silent when the last weigh-in was yesterday', () => {
		expect(shouldRemindWeighIn(state({ lastDate: '2026-10-02' }))).toBe(false);
	});

	it('stays silent until tomorrow after postponing', () => {
		expect(shouldRemindWeighIn(state({ postponedOn: '2026-10-03' }))).toBe(false);
		expect(shouldRemindWeighIn(state({ postponedOn: '2026-10-02' }))).toBe(true);
	});

	it('stays silent when the reminder is disabled in settings', () => {
		expect(shouldRemindWeighIn(state({ enabled: false }))).toBe(false);
	});
});
