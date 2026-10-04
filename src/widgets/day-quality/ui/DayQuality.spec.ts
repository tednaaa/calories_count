import { mount } from '@vue/test-utils';
import DayQuality from './DayQuality.vue';

function mountQuality(props: Partial<InstanceType<typeof DayQuality>['$props']> = {}) {
  return mount(DayQuality, {
    props: { measured: 1, entries: 3, weightKg: 85, targetKcal: 2400, ...props },
  });
}

describe('day nutrients', () => {
  it('shows eaten next to target', () => {
    const wrapper = mountQuality({ nutrients: { protein: 54, sugars: 12 } });

    expect(wrapper.text()).toContain('54 / 136 г');
    expect(wrapper.text()).toContain('12 / 60 г');
  });

  it('tells how many entries the totals cover', () => {
    expect(mountQuality({ nutrients: { protein: 54 } }).text()).toContain('по 1 записи из 3');
  });

  it('highlights excess sugar', () => {
    const wrapper = mountQuality({ nutrients: { sugars: 90 } });

    expect(wrapper.find('.bg-destructive').exists()).toBe(true);
  });

  it('does not warn about low protein', () => {
    const wrapper = mountQuality({ nutrients: { protein: 10 } });

    expect(wrapper.find('.bg-destructive').exists()).toBe(false);
  });

  it('marks a reached target', () => {
    const wrapper = mountQuality({ nutrients: { protein: 140 } });

    expect(wrapper.find('.bg-success').exists()).toBe(true);
  });

  it('shows fat and carbs without targets', () => {
    const wrapper = mountQuality({ nutrients: { fat: 12, carbs: 68 } });

    expect(wrapper.text()).toContain('Жиры 12 г · Углеводы 68 г');
  });

  it('explains where nutrients come from when none are known', () => {
    const wrapper = mountQuality();

    expect(wrapper.text()).toContain('по штрих-коду');
  });

  it('renders nothing on an empty day', () => {
    expect(mountQuality({ entries: 0 }).text()).toBe('');
  });
});
