import type { CartItem } from './entry';
import type { Entry } from '@/shared/db';
import {
  buildCustomEntry,
  buildEntries,
  entryKcal,
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

describe('entryKcal', () => {
  it('умножает порцию на количество', () => {
    expect(entryKcal(entry({ qty: 2, kcalPerPortion: 78 }))).toBe(156);
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
