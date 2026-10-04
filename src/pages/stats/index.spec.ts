import type { Entry, Profile } from '@/shared/db';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { useLiveQuery } from '@/shared/lib';
import StatsView from './index.vue';

const { push, route } = vi.hoisted(() => ({
  push: vi.fn(),
  route: { query: {} as Record<string, unknown> },
}));

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  const reactiveRoute = reactive(route);

  return {
    useRoute: () => reactiveRoute,
    useRouter: () => ({
      push,
      replace: (to: { query?: Record<string, unknown> }) => {
        reactiveRoute.query = to.query ?? {};
      },
    }),
  };
});

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  loadProfile: vi.fn(),
}));

vi.mock('@/shared/lib', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/lib')>(),
  useLiveQuery: vi.fn(),
}));

const entries = ref<Entry[]>([]);
const profile = ref<Profile | undefined>(undefined);

function entry(date: string, kcal: number): Entry {
  return {
    id: `entry-${date}`,
    date,
    createdAt: Date.parse(`${date}T09:00:00`),
    foodId: 'rice-beef',
    qty: 1,
    kcalPerPortion: kcal,
    name: 'Рис с говядиной',
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 19, 12, 0));

  route.query = {};
  entries.value = [];
  profile.value = { targetKcal: 2400, goal: 'cutMild' } as Profile;

  vi.mocked(useLiveQuery).mockImplementation(
    (_querier, initial) => (Array.isArray(initial) ? entries : profile) as never,
  );
});

afterEach(() => {
  vi.useRealTimers();
});

function mountStats() {
  return mount(StatsView, { global: { stubs: { WeightSection: true } } });
}

function dayButton(wrapper: ReturnType<typeof mountStats>, day: number) {
  return wrapper.findAll('section button').find(button => button.find('span').text() === String(day))!;
}

describe('stats screen', () => {
  it('renders a cell for every day of the month', () => {
    expect(mountStats().findAll('section button')).toHaveLength(31);
  });

  it('disables future days', () => {
    const wrapper = mountStats();

    expect(dayButton(wrapper, 20).attributes('disabled')).toBeDefined();
    expect(dayButton(wrapper, 19).attributes('disabled')).toBeUndefined();
  });

  it('shows an empty state without entries', () => {
    expect(mountStats().text()).toContain('За этот месяц записей нет');
  });

  it('shows kcal in the day cell', () => {
    entries.value = [entry('2026-08-18', 1850)];

    expect(dayButton(mountStats(), 18).text()).toContain('1 850');
  });

  it('averages only over days with entries', () => {
    entries.value = [entry('2026-08-18', 2000), entry('2026-08-19', 3000)];

    const text = mountStats().text();

    expect(text).toContain('2 500 ккал');
    expect(text).toContain('5 000 ккал');
    expect(text).toContain('2 дня с записями');
  });

  it('computes deviation from target over days with entries', () => {
    entries.value = [13, 14, 15, 16, 17, 18, 19].map(day => entry(`2026-08-${day}`, 2000));

    expect(mountStats().text()).toContain('дефицит 2 800 ккал ≈ 0,36 кг');
  });

  it('hides deviation from target for just a couple of days', () => {
    entries.value = [entry('2026-08-19', 2000)];

    expect(mountStats().text()).not.toContain('дефицит');
  });

  it('ignores days of another month', () => {
    entries.value = [entry('2026-07-31', 5000), entry('2026-08-19', 2400)];

    expect(mountStats().text()).toContain('1 день с записями');
  });

  it('colors a day well above target differently', () => {
    entries.value = [entry('2026-08-18', 2450), entry('2026-08-19', 3000)];

    const wrapper = mountStats();

    expect(dayButton(wrapper, 19).classes()).toContain('bg-destructive/15');
    expect(dayButton(wrapper, 18).classes()).toContain('bg-primary/15');
  });

  it('marks today for screen readers', () => {
    expect(dayButton(mountStats(), 19).attributes('aria-current')).toBe('date');
    expect(dayButton(mountStats(), 18).attributes('aria-current')).toBeUndefined();
  });

  it('opens the day on tap', async () => {
    await dayButton(mountStats(), 13).trigger('click');

    expect(push).toHaveBeenCalledWith({ path: '/', query: { date: '2026-08-13' } });
  });

  it('pages to the previous month and back', async () => {
    const wrapper = mountStats();

    await wrapper.get('[aria-label="Предыдущий месяц"]').trigger('click');
    await nextTick();

    expect(route.query).toEqual({ month: '2026-07' });
    expect(wrapper.text()).toContain('Июль 2026');

    await wrapper.get('[aria-label="Следующий месяц"]').trigger('click');
    await nextTick();

    expect(route.query).toEqual({});
    expect(wrapper.text()).toContain('Август 2026');
  });

  it('opens the calories tab by default', () => {
    expect(mountStats().find('weight-section-stub').exists()).toBe(false);
  });

  it('opens weight in a separate tab', () => {
    route.query = { tab: 'weight' };
    const wrapper = mountStats();

    expect(wrapper.find('weight-section-stub').exists()).toBe(true);
    expect(wrapper.findAll('section button')).toHaveLength(0);
  });

  it('stays on the current tab when paging months', async () => {
    route.query = { tab: 'kcal' };
    const wrapper = mountStats();

    await wrapper.get('[aria-label="Предыдущий месяц"]').trigger('click');

    expect(route.query).toEqual({ tab: 'kcal', month: '2026-07' });
  });

  it('does not page into the future', () => {
    expect(mountStats().get('[aria-label="Следующий месяц"]').attributes('disabled')).toBeDefined();
  });
});
