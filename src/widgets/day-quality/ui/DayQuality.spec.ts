import { mount } from '@vue/test-utils';
import DayQuality from './DayQuality.vue';

function mountQuality(props: Partial<InstanceType<typeof DayQuality>['$props']> = {}) {
  return mount(DayQuality, {
    props: { measured: 1, entries: 3, weightKg: 85, targetKcal: 2400, ...props },
  });
}

function meterStatus(wrapper: ReturnType<typeof mountQuality>, name: string) {
  return wrapper.get(`[role="meter"][aria-label="${name}"]`).attributes('aria-valuetext');
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

  it('reports excess sugar as over the limit', () => {
    expect(meterStatus(mountQuality({ nutrients: { sugars: 90 } }), 'Сахар')).toBe('90 / 60 г, больше нормы');
  });

  it('reports low protein as not reached rather than over', () => {
    expect(meterStatus(mountQuality({ nutrients: { protein: 10 } }), 'Белки')).toBe('10 / 136 г, норма не набрана');
  });

  it('reports a reached target', () => {
    expect(meterStatus(mountQuality({ nutrients: { protein: 140 } }), 'Белки')).toBe('140 / 136 г, норма набрана');
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
