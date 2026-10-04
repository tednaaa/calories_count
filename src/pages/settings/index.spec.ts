import type { CustomFood, Profile } from '@/shared/db';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useCustomFoods } from '@/entities/food';
import { toDateKey, useLiveQuery, yearsBefore } from '@/shared/lib';
import SettingsView from './index.vue';

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
}));

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  loadProfile: vi.fn(),
}));

vi.mock('@/entities/food', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/food')>(),
  useCustomFoods: vi.fn(),
}));

vi.mock('@/shared/lib', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/lib')>(),
  useLiveQuery: vi.fn(),
}));

const profile = ref<Profile | undefined>(undefined);
const customFoods = ref<CustomFood[]>([]);

function saved(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'me',
    sex: 'male',
    birthDate: yearsBefore(toDateKey(), 30),
    heightCm: 180,
    weightKg: 85,
    activity: 'moderate',
    goal: 'cutMild',
    targetKcal: 2410,
    targetOverridden: false,
    createdAt: 1_755_600_000_000,
    updatedAt: 1_755_600_000_000,
    ...overrides,
  };
}

beforeEach(() => {
  profile.value = saved();
  customFoods.value = [];
  vi.mocked(useCustomFoods).mockReturnValue(customFoods);
  vi.mocked(useLiveQuery).mockImplementation(() => profile as never);
});

describe('settings screen', () => {
  it('shows the target and where it came from', () => {
    const text = mount(SettingsView).text();

    expect(text).toContain('2 410 ккал');
    expect(text).toContain('Посчитана по профилю');
  });

  it('summarizes the profile in one line', () => {
    expect(mount(SettingsView).text()).toContain('Мягкое похудение · 30 лет · 180 см · 85 кг');
  });

  it('disables the weigh-in reminder', async () => {
    localStorage.clear();
    const wrapper = mount(SettingsView);

    await wrapper.find('#weigh-in-reminder').trigger('click');

    expect(localStorage.getItem('weigh-in-reminder')).toBe('false');
  });

  it('hides the iPhone hint on other phones', () => {
    expect(mount(SettingsView).text()).not.toContain('На экран „Домой“');
  });
});
