import { mount } from '@vue/test-utils';
import NutrientStrip from './NutrientStrip.vue';

describe('полоска питательности', () => {
  it('показывает только то, что известно', () => {
    const wrapper = mount(NutrientStrip, { props: { nutrients: { sugars: 54, protein: 0 } } });

    expect(wrapper.text()).toContain('Сахар');
    expect(wrapper.text()).toContain('54 г');
    expect(wrapper.text()).not.toContain('Клетчатка');
  });

  it('показывает Nutri-Score и NOVA словами', () => {
    const wrapper = mount(NutrientStrip, { props: { grades: { nutriScore: 'e', nova: 4 } } });

    expect(wrapper.text()).toContain('e');
    expect(wrapper.text()).toContain('NOVA 4 · ультра-обработанное');
  });

  it('без данных не занимает место', () => {
    expect(mount(NutrientStrip, { props: {} }).text()).toBe('');
  });
});
