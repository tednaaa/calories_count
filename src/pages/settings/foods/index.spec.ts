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

describe('экран «Свои блюда»', () => {
  it('перечисляет заведённые блюда с калорийностью', () => {
    customFoods.value = [customFood()];

    const text = mount(FoodsView).text();

    expect(text).toContain('Пирог у бабушки');
    expect(text).toContain('350 ккал');
  });

  it('на пустом списке рассказывает, откуда берутся блюда', () => {
    expect(mount(FoodsView).text()).toContain('Пока пусто');
  });

  it('ведёт на правку каждого блюда', () => {
    customFoods.value = [customFood(), customFood({ id: 'soup', name: 'Суп у мамы' })];

    const links = mount(FoodsView).findAll('li a');

    expect(links.map(link => link.attributes('to'))).toEqual([
      '/settings/foods/pie',
      '/settings/foods/soup',
    ]);
  });
});
