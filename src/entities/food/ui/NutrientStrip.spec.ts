import { mount } from '@vue/test-utils';
import NutrientStrip from './NutrientStrip.vue';

describe('nutrient strip', () => {
  it('shows only known nutrients', () => {
    const wrapper = mount(NutrientStrip, { props: { nutrients: { sugars: 54, protein: 0 } } });

    expect(wrapper.text()).toContain('Сахар');
    expect(wrapper.text()).toContain('54 г');
    expect(wrapper.text()).not.toContain('Клетчатка');
  });

  it('shows Nutri-Score and NOVA in words', () => {
    const wrapper = mount(NutrientStrip, { props: { grades: { nutriScore: 'e', nova: 4 } } });

    expect(wrapper.text()).toContain('e');
    expect(wrapper.text()).toContain('NOVA 4 · ультра-обработанное');
  });

  it('renders nothing without data', () => {
    expect(mount(NutrientStrip, { props: {} }).text()).toBe('');
  });
});
