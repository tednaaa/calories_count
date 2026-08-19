import type { Entry, Profile } from '@/shared/db';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useLiveQuery } from '@/shared/lib';
import StatsView from './index.vue';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));

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

  entries.value = [];
  profile.value = { targetKcal: 2400 } as Profile;

  vi.mocked(useLiveQuery).mockImplementation(
    (_querier, initial) => (Array.isArray(initial) ? entries : profile) as never,
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('экран статистики', () => {
  it('рисует столбик на каждый день окна', () => {
    expect(mount(StatsView).findAll('button')).toHaveLength(7);
  });

  it('без записей показывает пустое состояние', () => {
    expect(mount(StatsView).text()).toContain('За эту неделю записей пока нет');
  });

  it('среднее считает только по дням с записями', () => {
    entries.value = [entry('2026-08-18', 2000), entry('2026-08-19', 3000)];

    const text = mount(StatsView).text();

    expect(text).toContain('2 500 ккал');
    expect(text).toContain('5 000 ккал');
    expect(text).toContain('2 дня с записями');
  });

  it('отклонение считает от цели за прожитые дни', () => {
    entries.value = [entry('2026-08-19', 2000)];

    expect(mount(StatsView).text()).toContain('дефицит 400 ккал ≈ 0,05 кг');
  });

  it('не берёт в расчёт дни за пределами окна', () => {
    entries.value = [entry('2026-08-01', 5000), entry('2026-08-19', 2400)];

    expect(mount(StatsView).text()).toContain('1 день с записями');
  });

  it('столбик выше цели окрашен иначе', () => {
    entries.value = [entry('2026-08-19', 3000)];

    const bars = mount(StatsView).findAll('button span');

    expect(bars[6].classes()).toContain('bg-bg-danger');
    expect(bars[5].classes()).toContain('bg-bg-brand');
  });

  it('тап по столбику открывает этот день', async () => {
    const wrapper = mount(StatsView);
    await wrapper.findAll('button')[0].trigger('click');

    expect(push).toHaveBeenCalledWith({ path: '/', query: { date: '2026-08-13' } });
  });
});
