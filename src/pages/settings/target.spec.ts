import type { Profile } from '@/shared/db';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { resetCalibration, resetTargetToCalculated, setManualTarget } from '@/entities/profile';
import { toDateKey, useLiveQuery, yearsBefore } from '@/shared/lib';
import TargetView from './target.vue';

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
}));

vi.mock('shonk-ui', async importOriginal => ({
  ...await importOriginal<typeof import('shonk-ui')>(),
  toast: vi.fn(),
}));

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  loadProfile: vi.fn(),
  setManualTarget: vi.fn(),
  resetTargetToCalculated: vi.fn(),
  resetCalibration: vi.fn(),
}));

vi.mock('@/shared/lib', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/lib')>(),
  useLiveQuery: vi.fn(),
}));

const profile = ref<Profile | undefined>(undefined);

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
  vi.mocked(useLiveQuery).mockImplementation(() => profile as never);
});

describe('target screen', () => {
  it('shows the saved target', () => {
    expect(mount(TargetView).text()).toContain('2 410');
  });

  it('explains how the target is built', () => {
    const text = mount(TargetView).text();

    expect(text).toContain('Обмен в покое');
    expect(text).toContain('Мягкое похудение');
    expect(text).toContain('−15 %');
  });

  it('opens the manual target field on button press', async () => {
    const wrapper = mount(TargetView);

    expect(wrapper.find('#target').exists()).toBe(false);

    await wrapper.findElementByText('button', 'Задать вручную').trigger('click');

    expect(wrapper.find('#target').exists()).toBe(true);
  });

  it('sets the target manually', async () => {
    const wrapper = mount(TargetView);
    await wrapper.findElementByText('button', 'Задать вручную').trigger('click');
    await wrapper.find('#target').setValue('2000');
    await wrapper.findElementByText('button', 'Задать').trigger('click');

    expect(setManualTarget).toHaveBeenCalledWith(2000);
  });

  it('rejects a target out of range', async () => {
    const wrapper = mount(TargetView);
    await wrapper.findElementByText('button', 'Задать вручную').trigger('click');
    await wrapper.find('#target').setValue('120');

    expect(wrapper.findElementByText('button', 'Задать').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('от 800 до 6 000');
  });

  it('offers reset to calculated only for a manual target', async () => {
    const wrapper = mount(TargetView);

    expect(wrapper.findElementByText('button', 'Вернуть расчётную')).toBeUndefined();

    profile.value = saved({ targetOverridden: true });
    await wrapper.vm.$nextTick();
    await wrapper.findElementByText('button', 'Вернуть расчётную').trigger('click');

    expect(resetTargetToCalculated).toHaveBeenCalled();
  });

  it('shows the weight calibration and allows resetting it', async () => {
    profile.value = saved({ tdeeCorrectionKcal: -330, calibratedAt: 1_755_600_000_000 });
    const wrapper = mount(TargetView);

    expect(wrapper.text()).toContain('Посчитана по профилю и уточнена по весу');
    expect(wrapper.text()).toContain('на 330 ккал ниже формулы');
    expect(wrapper.text()).not.toContain('Задана вручную');

    await wrapper.findElementByText('button', 'Сбросить уточнение').trigger('click');

    expect(resetCalibration).toHaveBeenCalled();
  });
});
