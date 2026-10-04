import type { CalibrationOffer } from '../lib/calibration';
import type { Impact } from '../lib/impact';
import { flushPromises, mount } from '@vue/test-utils';
import { applyCalibration } from '@/entities/profile';
import NormCalibration from './NormCalibration.vue';

vi.mock('@/entities/profile', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/profile')>(),
  applyCalibration: vi.fn(),
}));

const impact: Impact = {
  weighIns: 9,
  trackedDays: 27,
  countedDays: 27,
  coverage: 1,
  averageIntake: 2400,
  expectedPerWeek: -0.4,
  actualPerWeek: -0.2,
  realTdee: 2620,
  realTdeeError: 238,
  projection: null,
};

function mountOffer(offer: CalibrationOffer) {
  return mount(NormCalibration, { props: { offer, impact, estimatedTdee: 2836, goal: 'cutMild' } });
}

describe('target calibration', () => {
  it('explains where the new target comes from', () => {
    const text = mountOffer({ kind: 'offer', ideal: 2230, next: 2230, tdeeCorrectionKcal: -217 }).text();

    expect(text).toContain('Вы ели в среднем 2 400 ккал, вес шёл −0,20 кг/нед');
    expect(text).toContain('реальный расход ≈ 2 620 ккал, а не 2 840, как считалось');
    expect(text).toContain('Для цели «Мягкое похудение» норма — 2 230 ккал');
    expect(text).not.toContain('За раз норма сдвигается');
  });

  it('states the difference from the estimate briefly', () => {
    expect(mountOffer({ kind: 'offer', ideal: 2230, next: 2230, tdeeCorrectionKcal: -216 }).text())
      .toContain('вы тратите на 220 ккал меньше, чем по расчёту');
  });

  it('says a large shift is split into several steps', () => {
    expect(mountOffer({ kind: 'offer', ideal: 1870, next: 2160, tdeeCorrectionKcal: -295 }).text()).toContain('сейчас 2 160, остальное при следующем уточнении');
  });

  it('applies the calibration on button press', async () => {
    const wrapper = mountOffer({ kind: 'offer', ideal: 2230, next: 2230, tdeeCorrectionKcal: -217 });

    await wrapper.findElementByText('button', 'Поставить 2 230 ккал').trigger('click');
    await flushPromises();

    expect(applyCalibration).toHaveBeenCalledWith(-217);
  });

  it('shows remaining weigh-ins instead of the button', () => {
    const wrapper = mountOffer({ kind: 'fewWeighIns', missing: 3 });

    expect(wrapper.text()).toContain('Ещё 3 взвешивания — и можно уточнить норму');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('tells when the next calibration is after one', () => {
    const wrapper = mountOffer({ kind: 'recent', daysLeft: 20 });

    expect(wrapper.text()).toContain('Следующее уточнение — через 20 дней');
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
