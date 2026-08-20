import type { CustomFood, Entry, Profile } from '@/shared/db';
import { mount } from '@vue/test-utils';
import { toast } from 'shonk-ui';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { EntryRow, removeEntry, restoreEntry, setEntryQty } from '@/entities/entry';
import { useCustomFoods } from '@/entities/food';
import { useLiveQuery } from '@/shared/lib';
import TodayView from './index.vue';

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  const route = reactive({ query: {} as Record<string, unknown> });

  return {
    RouterLink: { template: '<a><slot /></a>' },
    useRoute: () => route,
    useRouter: () => ({
      replace: (to: { query?: Record<string, unknown> }) => {
        route.query = to.query ?? {};
      },
    }),
  };
});

vi.mock('shonk-ui', async importOriginal => ({
  ...await importOriginal<typeof import('shonk-ui')>(),
  toast: vi.fn(),
}));

vi.mock('@/entities/entry', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/entry')>(),
  removeEntry: vi.fn(),
  restoreEntry: vi.fn(),
  setEntryQty: vi.fn(),
}));

vi.mock('@/entities/food', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/food')>(),
  useCustomFoods: vi.fn(),
}));

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  loadProfile: vi.fn(),
}));

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

describe('экран «Сегодня»', () => {
  it('показывает пустой день', () => {
    const wrapper = mount(TodayView);

    expect(wrapper.text()).toContain('Сегодня');
    expect(wrapper.text()).toContain('Сегодня пока пусто');
  });

  it('складывает калории записей', () => {
    entries.value = [entry({ qty: 2, kcalPerPortion: 78 }), entry({ id: 'entry-2' })];
    const wrapper = mount(TodayView);

    expect(wrapper.text()).toContain('161');
  });

  it('удаление предлагает вернуть запись', async () => {
    const removed = entry();
    entries.value = [removed];
    const wrapper = mount(TodayView);

    await wrapper.findComponent(EntryRow).vm.$emit('remove', removed);

    expect(removeEntry).toHaveBeenCalledWith('entry-1');
    expect(toast).toHaveBeenCalledWith('Запись удалена', expect.anything());
  });

  it('нажатие «Вернуть» восстанавливает запись целиком', async () => {
    const removed = entry();
    entries.value = [removed];
    const wrapper = mount(TodayView);

    await wrapper.findComponent(EntryRow).vm.$emit('remove', removed);

    const options = vi.mocked(toast).mock.calls[0][1] as { action: { onClick: () => void } };
    options.action.onClick();

    expect(restoreEntry).toHaveBeenCalledWith(removed);
  });

  it('меняет количество порций', async () => {
    entries.value = [entry()];
    const wrapper = mount(TodayView);

    await wrapper.findComponent(EntryRow).vm.$emit('changeQty', 'entry-1', 3);

    expect(setEntryQty).toHaveBeenCalledWith('entry-1', 3);
  });

  it('не даёт опустить количество ниже одной порции', async () => {
    entries.value = [entry()];
    const wrapper = mount(TodayView);

    await wrapper.findComponent(EntryRow).vm.$emit('changeQty', 'entry-1', 0);

    expect(setEntryQty).not.toHaveBeenCalled();
  });

  it('листает на предыдущий день и обратно', async () => {
    const wrapper = mount(TodayView);
    const [back, forward] = wrapper.findAll('header button');

    await back.trigger('click');
    expect(wrapper.text()).toContain('Вчера');

    await forward.trigger('click');
    expect(wrapper.text()).toContain('Сегодня');
  });

  it('открывает день, указанный в адресе', () => {
    useRouter().replace({ query: { date: '2026-08-17' } });

    expect(mount(TodayView).text()).toContain('17 августа');
  });

  it('не пускает в будущее', () => {
    const wrapper = mount(TodayView);
    const forward = wrapper.findAll('header button')[1];

    expect(forward.attributes('disabled')).toBeDefined();
  });
});
