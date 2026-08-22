import type { Food } from '@/entities/food';
import type { CustomFood } from '@/shared/db';
import { flushPromises, mount } from '@vue/test-utils';
import { toast } from 'shonk-ui';
import { ref } from 'vue';
import { addEntries } from '@/entities/entry';
import { activeFoods } from '@/entities/food';
import { useCustomFoods } from '@/entities/food/lib/use-custom-foods';
import { toDateKey, useLiveQuery } from '@/shared/lib';
import AddView from './index.vue';
import { VIEW_MODE_KEY } from './lib/view-mode';
import FoodCard from './ui/FoodCard.vue';
import FoodRow from './ui/FoodRow.vue';

const { push, route } = vi.hoisted(() => ({
  push: vi.fn(),
  route: { query: {} as Record<string, unknown> },
}));

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}));

vi.mock('shonk-ui', async importOriginal => ({
  ...await importOriginal<typeof import('shonk-ui')>(),
  toast: vi.fn(),
}));

vi.mock('@/entities/entry', async importOriginal => ({
  ...await importOriginal<typeof import('@/entities/entry')>(),
  addEntries: vi.fn(),
}));

vi.mock('@/shared/lib', async importOriginal => ({
  ...await importOriginal<typeof import('@/shared/lib')>(),
  useLiveQuery: vi.fn(),
}));

vi.mock('@/entities/food/lib/catalog', async (importOriginal) => {
  const { matchesQuery } = await importOriginal<typeof import('@/entities/food/lib/catalog')>();

  const foods: Food[] = [
    { id: 'coffee-black', name: 'Кофе чёрный', kcal: 5, photo: 'coffee-black.webp', category: 'drinks' },
    { id: 'coffee-milk', name: 'Кофе с молоком', kcal: 60, photo: 'coffee-milk.webp', category: 'drinks' },
    { id: 'tea-black', name: 'Чай чёрный', kcal: 2, photo: 'tea-black.webp', category: 'drinks' },
    { id: 'apple', name: 'Яблоко', kcal: 80, photo: 'apple.webp', category: 'snacks', tags: ['фрукт'] },
    { id: 'banana', name: 'Банан', kcal: 100, photo: 'banana.webp', category: 'snacks', tags: ['фрукт'] },
  ];

  const byId = new Map(foods.map(food => [food.id, food]));

  return {
    matchesQuery,
    foods,
    activeFoods: foods,
    foodById: (id: string) => byId.get(id),
    photoUrl: (food: Food) => `/foods/${food.photo}`,
    searchFoods: (query: string, category?: string) => foods.filter(food => (
      (!category || food.category === category) && matchesQuery(food, query)
    )),
  };
});

vi.mock('@/entities/food/lib/use-custom-foods', () => ({
  useCustomFoods: vi.fn(),
}));

const frequentIds = ref<string[]>([]);
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
  localStorage.clear();
  route.query = {};
  frequentIds.value = [];
  customFoods.value = [];
  vi.mocked(useCustomFoods).mockReturnValue(customFoods);
  vi.mocked(useLiveQuery).mockImplementation(() => frequentIds as never);
});

function cards(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAllComponents(FoodCard);
}

async function tap(wrapper: ReturnType<typeof mount>, index: number) {
  await cards(wrapper)[index].find('button').trigger('click');
}

async function plus(wrapper: ReturnType<typeof mount>, index: number) {
  await cards(wrapper)[index].find('button[aria-label^="Добавить"]').trigger('click');
}

describe('экран «Добавить»', () => {
  it('показывает весь каталог', () => {
    const wrapper = mount(AddView);

    expect(cards(wrapper)).toHaveLength(activeFoods.length);
  });

  it('фильтрует по названию', async () => {
    const wrapper = mount(AddView);
    await wrapper.find('input[type="search"]').setValue('кофе');

    expect(cards(wrapper).map(card => card.text())).toEqual([
      expect.stringContaining('Кофе чёрный'),
      expect.stringContaining('Кофе с молоком'),
    ]);
  });

  it('фильтрует по тегу', async () => {
    const wrapper = mount(AddView);
    await wrapper.find('input[type="search"]').setValue('фрукт');

    expect(cards(wrapper)).toHaveLength(2);
  });

  it('фильтрует по категории', async () => {
    const wrapper = mount(AddView);
    await wrapper.findElementByText('button', 'Напитки').trigger('click');

    expect(cards(wrapper)).toHaveLength(3);
  });

  it('сообщает, когда ничего не нашлось', async () => {
    const wrapper = mount(AddView);
    await wrapper.find('input[type="search"]').setValue('лобстер');

    expect(wrapper.text()).toContain('Ничего не нашлось');
  });

  it('показывает блок «Часто» поверх каталога', () => {
    frequentIds.value = ['coffee-black'];
    const wrapper = mount(AddView);

    expect(wrapper.text()).toContain('Часто');
    expect(cards(wrapper)).toHaveLength(activeFoods.length + 1);
  });

  it('прячет блок «Часто» при поиске', async () => {
    frequentIds.value = ['coffee-black'];
    const wrapper = mount(AddView);
    await wrapper.find('input[type="search"]').setValue('кофе');

    expect(wrapper.text()).not.toContain('Часто');
  });

  it('показывает свои блюда отдельным блоком', () => {
    customFoods.value = [customFood()];
    const wrapper = mount(AddView);

    expect(wrapper.text()).toContain('Своё');
    expect(cards(wrapper)).toHaveLength(activeFoods.length + 1);
  });

  it('чипс «Своё» оставляет только свои блюда', async () => {
    customFoods.value = [customFood()];
    const wrapper = mount(AddView);
    await wrapper.findElementByText('button', 'Своё').trigger('click');

    expect(cards(wrapper).map(card => card.text())).toEqual([
      expect.stringContaining('Пирог у бабушки'),
    ]);
  });

  it('ищет и по своим блюдам', async () => {
    customFoods.value = [customFood()];
    const wrapper = mount(AddView);
    await wrapper.find('input[type="search"]').setValue('пирог');

    expect(cards(wrapper)).toHaveLength(1);
  });

  it('говорит, что своих блюд ещё нет', async () => {
    const wrapper = mount(AddView);
    await wrapper.findElementByText('button', 'Своё').trigger('click');

    expect(wrapper.text()).toContain('Своих блюд пока нет');
  });

  it('своё блюдо кладётся в корзину как обычное', async () => {
    customFoods.value = [customFood()];
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await wrapper.findElementByText('button', 'Подтвердить').trigger('click');
    await flushPromises();

    expect(addEntries).toHaveBeenCalledWith(toDateKey(), [
      { foodId: 'pie', name: 'Пирог у бабушки', kcalPerPortion: 350, qty: 1 },
    ]);
  });

  it('своё блюдо попадает в «Часто»', () => {
    customFoods.value = [customFood()];
    frequentIds.value = ['pie'];
    const wrapper = mount(AddView);

    expect(wrapper.text()).toContain('Часто');
    expect(cards(wrapper)).toHaveLength(activeFoods.length + 2);
  });

  it('по умолчанию показывает карточки', () => {
    const wrapper = mount(AddView);

    expect(cards(wrapper)).toHaveLength(activeFoods.length);
    expect(wrapper.findAllComponents(FoodRow)).toHaveLength(0);
  });

  it('крупный вид оставляет карточки, но меняет сетку', () => {
    localStorage.setItem(VIEW_MODE_KEY, 'large');
    const wrapper = mount(AddView);

    expect(wrapper.find('ul').classes()).toContain('grid-cols-2');
    expect(cards(wrapper)).toHaveLength(activeFoods.length);
  });

  it('список показывает строки вместо карточек', () => {
    localStorage.setItem(VIEW_MODE_KEY, 'list');
    const wrapper = mount(AddView);

    expect(wrapper.findAllComponents(FoodRow)).toHaveLength(activeFoods.length);
    expect(cards(wrapper)).toHaveLength(0);
  });

  it('незнакомый вид из хранилища не ломает экран', () => {
    localStorage.setItem(VIEW_MODE_KEY, 'карточки');
    const wrapper = mount(AddView);

    expect(cards(wrapper)).toHaveLength(activeFoods.length);
  });

  it('в списке блюдо кладётся в корзину тапом по строке', async () => {
    localStorage.setItem(VIEW_MODE_KEY, 'list');
    const wrapper = mount(AddView);
    await wrapper.findAllComponents(FoodRow)[0].find('button').trigger('click');

    expect(wrapper.text()).toContain('1 позиция · 5 ккал');
  });

  it('кнопка вида называет текущий', () => {
    localStorage.setItem(VIEW_MODE_KEY, 'list');

    expect(mount(AddView).find('button[aria-label="Вид: Список"]').exists()).toBe(true);
  });

  it('до первого выбора корзины нет', () => {
    const wrapper = mount(AddView);

    expect(wrapper.text()).not.toContain('Подтвердить');
  });

  it('тап по карточке кладёт блюдо в корзину', async () => {
    const wrapper = mount(AddView);
    await tap(wrapper, 0);

    expect(wrapper.text()).toContain('1 позиция · 5 ккал');
  });

  it('повторный тап убирает блюдо из корзины', async () => {
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await tap(wrapper, 0);

    expect(wrapper.text()).not.toContain('Подтвердить');
  });

  it('плюс увеличивает количество', async () => {
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await plus(wrapper, 0);

    expect(wrapper.text()).toContain('1 позиция · 10 ккал');
  });

  it('разные блюда становятся разными позициями', async () => {
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await tap(wrapper, 1);

    expect(wrapper.text()).toContain('2 позиции · 65 ккал');
  });

  it('подтверждение сохраняет корзину за сегодня и уводит на главную', async () => {
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await plus(wrapper, 0);
    await wrapper.findElementByText('button', 'Подтвердить').trigger('click');
    await flushPromises();

    expect(addEntries).toHaveBeenCalledWith(toDateKey(), [
      { foodId: 'coffee-black', name: 'Кофе чёрный', kcalPerPortion: 5, qty: 2 },
    ]);
    expect(push).toHaveBeenCalledWith({ path: '/', query: {} });
  });

  it('пишет записи в дату из адреса', async () => {
    route.query = { date: '2026-08-17' };
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await wrapper.findElementByText('button', 'Подтвердить').trigger('click');
    await flushPromises();

    expect(addEntries).toHaveBeenCalledWith('2026-08-17', expect.anything());
    expect(push).toHaveBeenCalledWith({ path: '/', query: { date: '2026-08-17' } });
  });

  it('предупреждает, что запись идёт задним числом', () => {
    route.query = { date: '2026-08-17' };

    expect(mount(AddView).text()).toContain('запись задним числом');
  });

  it('игнорирует несуществующую дату в адресе', async () => {
    route.query = { date: '2026-02-30' };
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await wrapper.findElementByText('button', 'Подтвердить').trigger('click');
    await flushPromises();

    expect(addEntries).toHaveBeenCalledWith(toDateKey(), expect.anything());
  });

  it('игнорирует будущую дату в адресе', async () => {
    route.query = { date: '2999-01-01' };
    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await wrapper.findElementByText('button', 'Подтвердить').trigger('click');
    await flushPromises();

    expect(addEntries).toHaveBeenCalledWith(toDateKey(), expect.anything());
  });

  it('при ошибке записи оставляет корзину и даёт повторить', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(addEntries).mockRejectedValueOnce(new Error('quota'));

    const wrapper = mount(AddView);
    await tap(wrapper, 0);
    await wrapper.findElementByText('button', 'Подтвердить').trigger('click');
    await flushPromises();

    expect(toast).toHaveBeenCalledWith('Не удалось сохранить, попробуй ещё раз');
    expect(push).not.toHaveBeenCalled();

    await wrapper.findElementByText('button', 'Подтвердить').trigger('click');
    await flushPromises();

    expect(addEntries).toHaveBeenCalledTimes(2);
  });

  it('не сохраняет корзину дважды по двойному нажатию', async () => {
    const wrapper = mount(AddView);
    await tap(wrapper, 0);

    const confirm = wrapper.findElementByText('button', 'Подтвердить');
    await confirm.trigger('click');
    await confirm.trigger('click');
    await flushPromises();

    expect(addEntries).toHaveBeenCalledTimes(1);
  });
});
