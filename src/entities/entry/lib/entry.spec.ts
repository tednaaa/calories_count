import type { CartItem } from './entry';
import type { Entry } from '@/shared/db';
import {
  buildCustomEntry,
  buildEntries,
  decreaseQty,
  draftFromEntry,
  draftToEntry,
  entryKcal,
  increaseQty,
  nextEntry,
  rankFoodIdsByFrequency,
  totalKcal,
  totalsByDate,
} from './entry';

const NOW = 1_770_000_000_000;

const cart: CartItem[] = [
  { foodId: 'coffee-black', name: 'Кофе чёрный', kcalPerPortion: 5, qty: 1 },
  { foodId: 'egg-boiled', name: 'Яйцо варёное', kcalPerPortion: 78, qty: 2 },
];

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: crypto.randomUUID(),
    date: '2026-08-19',
    createdAt: NOW,
    foodId: 'coffee-black',
    qty: 1,
    kcalPerPortion: 5,
    name: 'Кофе чёрный',
    ...overrides,
  };
}

describe('buildEntries', () => {
  it('создаёт по записи на позицию корзины', () => {
    expect(buildEntries('2026-08-19', cart, NOW)).toHaveLength(2);
  });

  it('количество уходит в qty, а не размножает записи', () => {
    const [, eggs] = buildEntries('2026-08-19', cart, NOW);

    expect(eggs.qty).toBe(2);
  });

  it('копирует название и калорийность снапшотом', () => {
    const [coffee] = buildEntries('2026-08-19', cart, NOW);

    expect(coffee.name).toBe('Кофе чёрный');
    expect(coffee.kcalPerPortion).toBe(5);
    expect(coffee.foodId).toBe('coffee-black');
  });

  it('выдаёт уникальные идентификаторы', () => {
    const ids = buildEntries('2026-08-19', cart, NOW).map(item => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('сохраняет порядок корзины при одинаковом времени подтверждения', () => {
    const [first, second] = buildEntries('2026-08-19', cart, NOW);

    expect(second.createdAt).toBeGreaterThan(first.createdAt);
  });

  it('проставляет переданную дату', () => {
    expect(buildEntries('2026-08-01', cart, NOW).every(item => item.date === '2026-08-01')).toBe(true);
  });
});

describe('buildCustomEntry', () => {
  it('создаёт одну запись без блюда из каталога', () => {
    const custom = buildCustomEntry('2026-08-19', { name: 'Пирог', kcalPerPortion: 350 }, NOW);

    expect(custom.foodId).toBeUndefined();
    expect(custom.qty).toBe(1);
    expect(custom.name).toBe('Пирог');
    expect(custom.kcalPerPortion).toBe(350);
    expect(custom.date).toBe('2026-08-19');
  });

  it('хранит фото рядом с записью', () => {
    const custom = buildCustomEntry(
      '2026-08-19',
      { name: 'Пирог', kcalPerPortion: 350, photo: 'data:image/jpeg;base64,zzz' },
      NOW,
    );

    expect(custom.photo).toBe('data:image/jpeg;base64,zzz');
  });
});

describe('increaseQty', () => {
  it('с половины поднимает до целой порции', () => {
    expect(increaseQty(0.5)).toBe(1);
  });

  it('дальше считает целыми', () => {
    expect(increaseQty(1)).toBe(2);
    expect(increaseQty(2)).toBe(3);
  });

  it('первое нажатие даёт целую порцию', () => {
    expect(increaseQty(0)).toBe(1);
  });
});

describe('decreaseQty', () => {
  it('с целой порции опускает до половины', () => {
    expect(decreaseQty(1)).toBe(0.5);
  });

  it('с половины уводит в ноль', () => {
    expect(decreaseQty(0.5)).toBe(0);
  });

  it('выше целой считает целыми', () => {
    expect(decreaseQty(3)).toBe(2);
    expect(decreaseQty(2)).toBe(1);
  });

  it('половина появляется только между нулём и единицей', () => {
    const steps = [];
    let qty = 3;

    while (qty > 0) {
      qty = decreaseQty(qty);
      steps.push(qty);
    }

    expect(steps).toEqual([2, 1, 0.5, 0]);
  });
});

describe('entryKcal', () => {
  it('умножает порцию на количество', () => {
    expect(entryKcal(entry({ qty: 2, kcalPerPortion: 78 }))).toBe(156);
  });

  it('половина порции считается половиной калорий', () => {
    expect(entryKcal(entry({ qty: 0.5, kcalPerPortion: 230 }))).toBe(115);
  });
});

describe('totalKcal', () => {
  it('складывает записи', () => {
    expect(totalKcal([
      entry({ qty: 1, kcalPerPortion: 5 }),
      entry({ qty: 2, kcalPerPortion: 78 }),
    ])).toBe(161);
  });

  it('на пустом дне возвращает ноль', () => {
    expect(totalKcal([])).toBe(0);
  });
});

describe('totalsByDate', () => {
  it('группирует калории по дням', () => {
    const totals = totalsByDate([
      entry({ date: '2026-08-18', qty: 1, kcalPerPortion: 100 }),
      entry({ date: '2026-08-18', qty: 2, kcalPerPortion: 100 }),
      entry({ date: '2026-08-19', qty: 1, kcalPerPortion: 50 }),
    ]);

    expect(totals.get('2026-08-18')).toBe(300);
    expect(totals.get('2026-08-19')).toBe(50);
  });

  it('день без записей отсутствует в результате', () => {
    expect(totalsByDate([]).size).toBe(0);
  });
});

describe('rankFoodIdsByFrequency', () => {
  it('сортирует по числу записей', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'apple' }),
      entry({ foodId: 'coffee-black' }),
      entry({ foodId: 'coffee-black' }),
    ], 8);

    expect(ranked[0]).toBe('coffee-black');
  });

  it('не считает разовые записи, у которых нет блюда', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: undefined }),
      entry({ foodId: undefined }),
      entry({ foodId: 'apple' }),
    ], 8);

    expect(ranked).toEqual(['apple']);
  });

  it('при равном счёте выше то, что ели позже', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'apple', createdAt: NOW }),
      entry({ foodId: 'banana', createdAt: NOW + 5000 }),
    ], 8);

    expect(ranked[0]).toBe('banana');
  });

  it('учитывает количество записей, а не порций', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'egg-boiled', qty: 10, createdAt: NOW }),
      entry({ foodId: 'apple', createdAt: NOW + 1 }),
      entry({ foodId: 'apple', createdAt: NOW + 2 }),
    ], 8);

    expect(ranked[0]).toBe('apple');
  });

  it('обрезает по лимиту', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'apple' }),
      entry({ foodId: 'banana' }),
      entry({ foodId: 'curd' }),
    ], 2);

    expect(ranked).toHaveLength(2);
  });

  it('на пустом дневнике возвращает пустой список', () => {
    expect(rankFoodIdsByFrequency([], 8)).toEqual([]);
  });
});

describe('draftFromEntry', () => {
  it('раскладывает запись по полям формы', () => {
    expect(draftFromEntry(entry({ photo: 'data:image/jpeg;base64,zzz' }))).toEqual({
      name: 'Кофе чёрный',
      kcal: '5',
      photo: 'data:image/jpeg;base64,zzz',
    });
  });

  it('без своего снимка отдаёт пустую строку', () => {
    expect(draftFromEntry(entry()).photo).toBe('');
  });
});

describe('draftToEntry', () => {
  it('собирает правку записи', () => {
    expect(draftToEntry({ name: '  Пирог  ', kcal: '350', photo: '' })).toEqual({
      name: 'Пирог',
      kcalPerPortion: 350,
      photo: undefined,
    });
  });

  it('проверяет поля так же, как форма своего блюда', () => {
    expect(draftToEntry({ name: '', kcal: '350', photo: '' })).toBeNull();
    expect(draftToEntry({ name: 'Пирог', kcal: '90.5', photo: '' })).toBeNull();
  });
});

describe('nextEntry', () => {
  it('меняет только правленые поля и количество', () => {
    const current = entry();

    expect(nextEntry(current, { name: 'Кофе с молоком', kcalPerPortion: 40 }, 2)).toEqual({
      ...current,
      name: 'Кофе с молоком',
      kcalPerPortion: 40,
      qty: 2,
    });
  });

  it('оставляет запись при своём блюде', () => {
    expect(nextEntry(entry(), { name: 'Кофе', kcalPerPortion: 5 }, 1).foodId).toBe('coffee-black');
  });
});
