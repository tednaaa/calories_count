import type { WeightRecord } from '@/shared/db';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useLiveQuery } from '@/shared/lib';
import WeighInReminder from './WeighInReminder.vue';

vi.mock('@/shared/lib', async importOriginal => ({
	...await importOriginal<typeof import('@/shared/lib')>(),
	useLiveQuery: vi.fn(),
}));

const latest = ref<WeightRecord | null | undefined>(undefined);

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date(2026, 9, 3, 19, 0));
	localStorage.clear();
	latest.value = { date: '2026-09-30', kg: 85.4, createdAt: 0 };
	vi.mocked(useLiveQuery).mockReturnValue(latest as never);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('weigh-in reminder', () => {
	it('returns after midnight when dismissed today without an app restart', async () => {
		vi.setSystemTime(new Date(2026, 9, 3, 23, 58));
		const wrapper = mount(WeighInReminder);

		await wrapper.find('[aria-label="Не напоминать сегодня"]').trigger('click');
		expect(wrapper.text()).not.toContain('Запишите вес');

		vi.advanceTimersByTime(3 * 60_000);
		await flushPromises();

		expect(wrapper.text()).toContain('Запишите вес');
	});

	it('appears in the evening after several days without a weigh-in', () => {
		expect(mount(WeighInReminder).text()).toContain('Запишите вес');
	});

	it('stays hidden until the weight log loads', () => {
		latest.value = undefined;

		expect(mount(WeighInReminder).text()).not.toContain('Запишите вес');
	});

	it('appears when there are no weigh-ins yet', () => {
		latest.value = null;

		expect(mount(WeighInReminder).text()).toContain('Запишите вес');
	});

	it('close button hides it until tomorrow', async () => {
		const wrapper = mount(WeighInReminder);

		await wrapper.find('[aria-label="Не напоминать сегодня"]').trigger('click');
		await flushPromises();

		expect(wrapper.text()).not.toContain('Запишите вес');
		expect(localStorage.getItem('weigh-in-postponed-on')).toBe('2026-10-03');
	});

	it('stays hidden when the reminder is disabled', () => {
		localStorage.setItem('weigh-in-reminder', 'false');

		expect(mount(WeighInReminder).text()).not.toContain('Запишите вес');
	});
});
