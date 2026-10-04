import type { CustomFood } from '@/shared/db';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useCustomFoods } from '@/entities/food';
import FoodsView from './index.vue';

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
}));

vi.mock('@/entities/food', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/food')>(),
  useCustomFoods: vi.fn(),
}));

const customFoods = ref<CustomFood[]>([]);

function customFood(overrides: Partial<CustomFood> = {}): CustomFood {
  return {
    id: 'pie',
    name: 'Пирог у бабушки',
    kcal: 350,
    createdAt: 1_770_000_000_000,
    updatedAt: 1_770_000_000_000,
    ...overrides,
  };
}

beforeEach(() => {
  customFoods.value = [];
  vi.mocked(useCustomFoods).mockReturnValue(customFoods);
});

describe('custom foods screen', () => {
  it('lists custom foods with their calories', () => {
    customFoods.value = [customFood()];

    const text = mount(FoodsView).text();

    expect(text).toContain('Пирог у бабушки');
    expect(text).toContain('350 ккал');
  });

  it('explains where foods come from when the list is empty', () => {
    expect(mount(FoodsView).text()).toContain('Пока пусто');
  });

  it('links to editing each food', () => {
    customFoods.value = [customFood(), customFood({ id: 'soup', name: 'Суп у мамы' })];

    const links = mount(FoodsView).findAll('li a');

    expect(links.map(link => link.attributes('to'))).toEqual([
      '/settings/foods/pie',
      '/settings/foods/soup',
    ]);
  });
});
