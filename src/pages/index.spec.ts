import type { VueWrapper } from '@vue/test-utils';
import type { CustomFood, Entry, Profile } from '@/shared/db';
import { flushPromises, mount } from '@vue/test-utils';
import { toast } from 'shonk-ui';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { EntryRow, removeEntry, restoreEntry } from '@/entities/entry';
import { useCustomFoods } from '@/entities/food';
import { useLiveQuery } from '@/shared/lib';
import TodayView from './index.vue';

const { push, requireConfirm } = vi.hoisted(() => ({ push: vi.fn(), requireConfirm: vi.fn() }));

vi.mock('vue-router', async () => {
	const { reactive } = await import('vue');
	const route = reactive({ query: {} as Record<string, unknown> });

	return {
		RouterLink: { template: '<a><slot /></a>' },
		useRoute: () => route,
		useRouter: () => ({
			push,
			replace: (to: { query?: Record<string, unknown> }) => {
				route.query = to.query ?? {};
			},
		}),
	};
});

vi.mock('shonk-ui', async importOriginal => ({
	...await importOriginal<typeof import('shonk-ui')>(),
	toast: vi.fn(),
	useConfirm: () => ({ require: requireConfirm }),
}));

vi.mock('@/entities/entry', async importOriginal => ({
	...await importOriginal<typeof import('@/entities/entry')>(),
	removeEntry: vi.fn(),
	restoreEntry: vi.fn(),
}));

vi.mock('@/entities/food', async importOriginal => ({
	...await importOriginal<typeof import('@/entities/food')>(),
	useCustomFoods: vi.fn(),
}));

vi.mock('@/entities/profile', async importOriginal => ({
	...await importOriginal<typeof import('@/entities/profile')>(),
	loadProfile: vi.fn(),
}));

vi.mock('@/widgets/weigh-in', () => ({ WeighInReminder: { template: '<div />' } }));

vi.mock('@/shared/lib', async importOriginal => ({
	...await importOriginal<typeof import('@/shared/lib')>(),
	useLiveQuery: vi.fn(),
}));

const entries = ref<Entry[]>([]);
const customFoods = ref<CustomFood[]>([]);
const profile = ref<Profile | undefined>(undefined);

function entry(overrides: Partial<Entry> = {}): Entry {
	return {
		id: 'entry-1',
		date: '2026-08-19',
		createdAt: Date.parse('2026-08-19T09:15:00'),
		foodId: 'coffee-black',
		qty: 1,
		kcalPerPortion: 5,
		name: 'Кофе чёрный',
		...overrides,
	};
}

function currentWeekButtons(wrapper: VueWrapper) {
	const weeks = wrapper.findAll('[role="group"] > div');

	return weeks[weeks.length - 1].findAll('button');
}

function acceptRemoval() {
	const options = requireConfirm.mock.calls[0][0] as { accept: () => void };
	options.accept();

	return flushPromises();
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date(2026, 7, 19, 15, 0));

	useRouter().replace({ query: {} });

	entries.value = [];
	customFoods.value = [];
	vi.mocked(useCustomFoods).mockReturnValue(customFoods);
	profile.value = { targetKcal: 2410 } as Profile;

	vi.mocked(useLiveQuery).mockImplementation(
		(_querier, initial) => (Array.isArray(initial) ? entries : profile) as never,
	);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('today screen', () => {
	it('shows an empty day', () => {
		const wrapper = mount(TodayView);

		expect(wrapper.text()).toContain('Сегодня пока пусто');
	});

	it('sums entry calories', () => {
		entries.value = [entry({ qty: 2, kcalPerPortion: 78 }), entry({ id: 'entry-2' })];
		const wrapper = mount(TodayView);

		expect(wrapper.text()).toContain('161');
	});

	it('asks for confirmation and removes nothing without it', async () => {
		const removed = entry();
		entries.value = [removed];
		const wrapper = mount(TodayView);

		await wrapper.findComponent(EntryRow).vm.$emit('remove', removed);

		expect(removeEntry).not.toHaveBeenCalled();

		const options = requireConfirm.mock.calls[0][0] as { message: string; acceptButtonText: string };
		expect(options.message).toContain('Кофе чёрный');
	});

	it('offers to undo a removal', async () => {
		const removed = entry();
		entries.value = [removed];
		const wrapper = mount(TodayView);

		await wrapper.findComponent(EntryRow).vm.$emit('remove', removed);
		await acceptRemoval();

		expect(removeEntry).toHaveBeenCalledWith('entry-1');
		expect(toast).toHaveBeenCalledWith('Запись удалена', expect.anything());
	});

	it('undo restores the whole entry', async () => {
		const removed = entry();
		entries.value = [removed];
		const wrapper = mount(TodayView);

		await wrapper.findComponent(EntryRow).vm.$emit('remove', removed);
		await acceptRemoval();

		const options = vi.mocked(toast).mock.calls[0][1] as { action: { onClick: () => void } };
		options.action.onClick();

		expect(restoreEntry).toHaveBeenCalledWith(removed);
	});

	it('opens an entry on tap', async () => {
		const edited = entry();
		entries.value = [edited];
		const wrapper = mount(TodayView);

		await wrapper.findComponent(EntryRow).vm.$emit('edit', edited);

		expect(push).toHaveBeenCalledWith('/entry/entry-1');
	});

	it('does not open an entry on photo tap', async () => {
		entries.value = [entry({ photo: 'data:image/webp;base64,photo' })];
		const wrapper = mount(TodayView);

		await wrapper.find('li img').trigger('click');

		expect(push).not.toHaveBeenCalled();
	});

	it('opens the day picked in the strip and returns to today', async () => {
		const wrapper = mount(TodayView);

		await currentWeekButtons(wrapper)[1].trigger('click');
		expect(wrapper.text()).toContain('В этот день записей нет');
		expect(wrapper.find('[aria-current="date"]').attributes('aria-label')).toContain('18 август');

		await currentWeekButtons(wrapper)[2].trigger('click');
		expect(wrapper.text()).toContain('Сегодня пока пусто');
	});

	it('opens the day from the url', () => {
		useRouter().replace({ query: { date: '2026-08-17' } });

		const wrapper = mount(TodayView);

		expect(wrapper.find('[aria-current="date"]').attributes('aria-label')).toContain('17 август');
	});

	it('disables future days', () => {
		const wrapper = mount(TodayView);

		expect(currentWeekButtons(wrapper)[3].attributes('disabled')).toBeDefined();
	});
});
