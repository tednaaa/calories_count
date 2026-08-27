import { mount } from '@vue/test-utils';
import DayQuality from './DayQuality.vue';

function mountQuality(props: Partial<InstanceType<typeof DayQuality>['$props']> = {}) {
  return mount(DayQuality, {
    props: { measured: 1, entries: 3, weightKg: 85, targetKcal: 2400, ...props },
  });
}

describe('состав дня', () => {
  it('показывает съеденное рядом с нормой', () => {
    const wrapper = mountQuality({ nutrients: { protein: 54, sugars: 12 } });

    expect(wrapper.text()).toContain('54 / 136 г');
    expect(wrapper.text()).toContain('12 / 60 г');
  });

  it('честно говорит, по скольким записям посчитано', () => {
    expect(mountQuality({ nutrients: { protein: 54 } }).text()).toContain('по 1 записи из 3');
  });

  it('перебор по сахару выделяет', () => {
    const wrapper = mountQuality({ nutrients: { sugars: 90 } });

    expect(wrapper.find('.bg-bg-danger').exists()).toBe(true);
  });

  it('недобор по белку не ругается', () => {
    const wrapper = mountQuality({ nutrients: { protein: 10 } });

    expect(wrapper.find('.bg-bg-danger').exists()).toBe(false);
  });

  it('добранную цель отмечает', () => {
    const wrapper = mountQuality({ nutrients: { protein: 140 } });

    expect(wrapper.find('.bg-bg-success').exists()).toBe(true);
  });

  it('жиры и углеводы показывает без норм', () => {
    const wrapper = mountQuality({ nutrients: { fat: 12, carbs: 68 } });

    expect(wrapper.text()).toContain('Жиры 12 г · Углеводы 68 г');
  });

  it('без единого состава объясняет, откуда он берётся', () => {
    const wrapper = mountQuality();

    expect(wrapper.text()).toContain('по штрих-коду');
  });

  it('на пустом дне молчит', () => {
    expect(mountQuality({ entries: 0 }).text()).toBe('');
  });
});
