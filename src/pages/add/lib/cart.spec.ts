import type { Food } from '@/entities/food';
import { cartKcal, cartQty, cartSummary, toCartItem, withCartItem } from './cart';

function food(overrides: Partial<Food> = {}): Food {
  return {
    id: 'egg-boiled',
    name: 'Яйцо варёное',
    kcal: 78,
    photo: 'egg-boiled.webp',
    category: 'basics',
    ...overrides,
  };
}

describe('toCartItem', () => {
  it('снимает копию названия и калорийности блюда', () => {
    expect(toCartItem(food(), 2)).toEqual({
      foodId: 'egg-boiled',
      name: 'Яйцо варёное',
      kcalPerPortion: 78,
      qty: 2,
    });
  });
});

describe('withCartItem', () => {
  it('добавляет новую позицию в конец', () => {
    const coffee = toCartItem(food({ id: 'coffee-black', name: 'Кофе', kcal: 5 }), 1);
    const egg = toCartItem(food(), 1);

    expect(withCartItem([coffee], egg).map(item => item.foodId)).toEqual(['coffee-black', 'egg-boiled']);
  });

  it('меняет количество уже выбранной позиции, не двигая её', () => {
    const coffee = toCartItem(food({ id: 'coffee-black', name: 'Кофе', kcal: 5 }), 1);
    const egg = toCartItem(food(), 1);
    const result = withCartItem(withCartItem([coffee], egg), toCartItem(food({ id: 'coffee-black' }), 3));

    expect(result.map(item => [item.foodId, item.qty])).toEqual([['coffee-black', 3], ['egg-boiled', 1]]);
  });

  it('сохраняет снимок первой добавленной позиции при изменении количества', () => {
    const original = toCartItem(food(), 1);
    const renamed = toCartItem(food({ name: 'Яйцо', kcal: 999 }), 2);

    expect(withCartItem([original], renamed)[0]).toEqual({ ...original, qty: 2 });
  });

  it('половину порции оставляет в корзине', () => {
    const egg = toCartItem(food(), 1);

    expect(withCartItem([egg], { ...egg, qty: 0.5 })[0].qty).toBe(0.5);
  });

  it('убирает позицию, когда количество опускается до нуля', () => {
    const egg = toCartItem(food(), 1);

    expect(withCartItem([egg], { ...egg, qty: 0 })).toEqual([]);
  });

  it('не создаёт позицию с нулевым количеством', () => {
    expect(withCartItem([], toCartItem(food(), 0))).toEqual([]);
  });

  it('не изменяет исходный массив', () => {
    const items = [toCartItem(food(), 1)];
    withCartItem(items, toCartItem(food({ id: 'apple' }), 1));

    expect(items).toHaveLength(1);
  });
});

describe('cartQty', () => {
  it('возвращает количество выбранного блюда', () => {
    expect(cartQty([toCartItem(food(), 3)], 'egg-boiled')).toBe(3);
  });

  it('возвращает ноль для невыбранного блюда', () => {
    expect(cartQty([toCartItem(food(), 3)], 'apple')).toBe(0);
  });
});

describe('cartKcal', () => {
  it('умножает калорийность порции на количество', () => {
    const items = [
      toCartItem(food(), 2),
      toCartItem(food({ id: 'coffee-milk', kcal: 60 }), 1),
    ];

    expect(cartKcal(items)).toBe(216);
  });

  it('пустая корзина не даёт калорий', () => {
    expect(cartKcal([])).toBe(0);
  });
});

describe('cartSummary', () => {
  it('склоняет позиции по русским правилам', () => {
    const one = [toCartItem(food(), 1)];
    const two = [...one, toCartItem(food({ id: 'apple', kcal: 80 }), 1)];
    const five = [
      ...two,
      toCartItem(food({ id: 'banana', kcal: 100 }), 1),
      toCartItem(food({ id: 'curd', kcal: 160 }), 1),
      toCartItem(food({ id: 'shawarma', kcal: 700 }), 1),
    ];

    expect(cartSummary(one)).toContain('1 позиция');
    expect(cartSummary(two)).toContain('2 позиции');
    expect(cartSummary(five)).toContain('5 позиций');
  });

  it('показывает сумму калорий', () => {
    expect(cartSummary([toCartItem(food({ kcal: 1200 }), 1)])).toBe('1 позиция · 1 200 ккал');
  });
});
