import type { CartItem } from './entry';
import type { CustomDraft } from '@/entities/food';
import type { Entry } from '@/shared/db';
import {
  buildCustomEntry,
  buildEntries,
  countMeasured,
  decreaseQty,
  draftFromEntry,
  draftToEntry,
  entryAmount,
  entryKcal,
  increaseQty,
  nextEntry,
  rankFoodIdsByFrequency,
  toggleQty,
  totalKcal,
  totalNutrients,
  totalsByDate,
} from './entry';

const NOW = 1_770_000_000_000;

const cart: CartItem[] = [
  { foodId: 'coffee-black', name: 'Кофе чёрный', kcalPerPortion: 5, qty: 1 },
  { foodId: 'egg-boiled', name: 'Яйцо варёное', kcalPerPortion: 78, amount: 50, qty: 2 },
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
  it('creates one entry per cart item', () => {
    expect(buildEntries('2026-08-19', cart, NOW)).toHaveLength(2);
  });

  it('puts quantity into qty instead of duplicating entries', () => {
    const [, eggs] = buildEntries('2026-08-19', cart, NOW);

    expect(eggs.qty).toBe(2);
  });

  it('snapshots name and calories', () => {
    const [coffee] = buildEntries('2026-08-19', cart, NOW);

    expect(coffee.name).toBe('Кофе чёрный');
    expect(coffee.kcalPerPortion).toBe(5);
    expect(coffee.foodId).toBe('coffee-black');
  });

  it('snapshots the portion weight', () => {
    const [, eggs] = buildEntries('2026-08-19', cart, NOW);

    expect(eggs.amount).toBe(50);
  });

  it('keeps cart order when confirmed at the same time', () => {
    const [first, second] = buildEntries('2026-08-19', cart, NOW);

    expect(second.createdAt).toBeGreaterThan(first.createdAt);
  });

  it('sets the given date', () => {
    expect(buildEntries('2026-08-01', cart, NOW).every(item => item.date === '2026-08-01')).toBe(true);
  });
});

describe('buildCustomEntry', () => {
  it('creates a single entry without a catalog food', () => {
    const custom = buildCustomEntry('2026-08-19', { name: 'Пирог', kcalPerPortion: 350 }, NOW);

    expect(custom.foodId).toBeUndefined();
    expect(custom.qty).toBe(1);
    expect(custom.name).toBe('Пирог');
    expect(custom.kcalPerPortion).toBe(350);
    expect(custom.date).toBe('2026-08-19');
  });

  it('carries the portion weight into the entry', () => {
    const custom = buildCustomEntry('2026-08-19', { name: 'Овсянка', kcalPerPortion: 350, amount: 100 }, NOW);

    expect(custom.amount).toBe(100);
  });

  it('stores the photo with the entry', () => {
    const custom = buildCustomEntry(
      '2026-08-19',
      { name: 'Пирог', kcalPerPortion: 350, photo: 'data:image/jpeg;base64,zzz' },
      NOW,
    );

    expect(custom.photo).toBe('data:image/jpeg;base64,zzz');
  });
});

describe('increaseQty', () => {
  it('raises a half to a whole portion', () => {
    expect(increaseQty(0.5)).toBe(1);
  });

  it('counts in whole portions after that', () => {
    expect(increaseQty(1)).toBe(2);
    expect(increaseQty(2)).toBe(3);
  });

  it('gives a whole portion on first press', () => {
    expect(increaseQty(0)).toBe(1);
  });
});

describe('decreaseQty', () => {
  it('lowers a whole portion to a half', () => {
    expect(decreaseQty(1)).toBe(0.5);
  });

  it('lowers a half to zero', () => {
    expect(decreaseQty(0.5)).toBe(0);
  });

  it('counts in whole portions above one', () => {
    expect(decreaseQty(3)).toBe(2);
    expect(decreaseQty(2)).toBe(1);
  });
});

describe('toggleQty', () => {
  it('adds a whole portion when empty', () => {
    expect(toggleQty(0)).toBe(1);
  });

  it('removes a selected item entirely', () => {
    expect(toggleQty(1)).toBe(0);
    expect(toggleQty(3)).toBe(0);
  });
});

describe('entryKcal', () => {
  it('multiplies portion by quantity', () => {
    expect(entryKcal(entry({ qty: 2, kcalPerPortion: 78 }))).toBe(156);
  });

  it('counts a half portion as half the calories', () => {
    expect(entryKcal(entry({ qty: 0.5, kcalPerPortion: 230 }))).toBe(115);
  });
});

describe('entryAmount', () => {
  it('multiplies portion weight by quantity', () => {
    expect(entryAmount(entry({ qty: 2, amount: 100 }))).toBe(200);
  });

  it('weighs a half portion as half', () => {
    expect(entryAmount(entry({ qty: 0.5, amount: 30 }))).toBe(15);
  });

  it('returns undefined for an entry without weight', () => {
    expect(entryAmount(entry({ qty: 2 }))).toBeUndefined();
  });
});

describe('totalNutrients', () => {
  it('multiplies portion nutrients by quantity', () => {
    expect(totalNutrients([entry({ qty: 2, nutrients: { sugars: 12 } })])).toEqual({ sugars: 24 });
  });

  it('sums entries with nutrients and skips the rest', () => {
    const day = [
      entry({ nutrients: { sugars: 54, protein: 0 } }),
      entry({ id: 'kebab', name: 'Ангус-кебаб', kcalPerPortion: 850 }),
      entry({ id: 'cheese', nutrients: { protein: 22 } }),
    ];

    expect(totalNutrients(day)).toEqual({ protein: 22, sugars: 54 });
  });

  it('returns undefined for a day without nutrients', () => {
    expect(totalNutrients([entry()])).toBeUndefined();
  });
});

describe('countMeasured', () => {
  it('counts entries with known nutrients', () => {
    expect(countMeasured([entry({ nutrients: { sugars: 1 } }), entry({ id: 'kebab' })])).toBe(1);
  });
});

describe('totalKcal', () => {
  it('sums entries', () => {
    expect(totalKcal([
      entry({ qty: 1, kcalPerPortion: 5 }),
      entry({ qty: 2, kcalPerPortion: 78 }),
    ])).toBe(161);
  });

  it('returns zero for an empty day', () => {
    expect(totalKcal([])).toBe(0);
  });
});

describe('totalsByDate', () => {
  it('groups calories by day', () => {
    const totals = totalsByDate([
      entry({ date: '2026-08-18', qty: 1, kcalPerPortion: 100 }),
      entry({ date: '2026-08-18', qty: 2, kcalPerPortion: 100 }),
      entry({ date: '2026-08-19', qty: 1, kcalPerPortion: 50 }),
    ]);

    expect(totals.get('2026-08-18')).toBe(300);
    expect(totals.get('2026-08-19')).toBe(50);
  });

  it('omits days without entries', () => {
    expect(totalsByDate([]).size).toBe(0);
  });
});

describe('rankFoodIdsByFrequency', () => {
  it('sorts by entry count', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'apple' }),
      entry({ foodId: 'coffee-black' }),
      entry({ foodId: 'coffee-black' }),
    ], 8);

    expect(ranked[0]).toBe('coffee-black');
  });

  it('ignores one-off entries without a food', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: undefined }),
      entry({ foodId: undefined }),
      entry({ foodId: 'apple' }),
    ], 8);

    expect(ranked).toEqual(['apple']);
  });

  it('ranks the more recently eaten food higher on a tie', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'apple', createdAt: NOW }),
      entry({ foodId: 'banana', createdAt: NOW + 5000 }),
    ], 8);

    expect(ranked[0]).toBe('banana');
  });

  it('counts entries, not portions', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'egg-boiled', qty: 10, createdAt: NOW }),
      entry({ foodId: 'apple', createdAt: NOW + 1 }),
      entry({ foodId: 'apple', createdAt: NOW + 2 }),
    ], 8);

    expect(ranked[0]).toBe('apple');
  });

  it('truncates to the limit', () => {
    const ranked = rankFoodIdsByFrequency([
      entry({ foodId: 'apple' }),
      entry({ foodId: 'banana' }),
      entry({ foodId: 'curd' }),
    ], 2);

    expect(ranked).toHaveLength(2);
  });

  it('returns an empty list for an empty diary', () => {
    expect(rankFoodIdsByFrequency([], 8)).toEqual([]);
  });
});

function draft(overrides: Partial<CustomDraft> = {}): CustomDraft {
  return { name: 'Пирог', serving: 'portion', unit: 'g', amount: '', kcal: '350', portion: '', photo: '', ...overrides };
}

describe('draftFromEntry', () => {
  it('maps the entry to form fields', () => {
    expect(draftFromEntry(entry({ photo: 'data:image/jpeg;base64,zzz' }))).toEqual({
      name: 'Кофе чёрный',
      serving: 'portion',
      unit: 'g',
      amount: '',
      kcal: '5',
      portion: '',
      photo: 'data:image/jpeg;base64,zzz',
    });
  });

  it('returns an empty string without a photo', () => {
    expect(draftFromEntry(entry()).photo).toBe('');
  });

  it('opens the entry on the same serving tab', () => {
    const oatmeal = entry({ kcalPerPortion: 351, amount: 130, basis: { amount: 100, kcal: 270 } });

    expect(draftFromEntry(oatmeal)).toMatchObject({ serving: 'hundred', amount: '100', kcal: '270', portion: '130' });
  });
});

describe('draftToEntry', () => {
  it('builds the entry edit', () => {
    expect(draftToEntry(draft({ name: '  Пирог  ' }))).toEqual({
      name: 'Пирог',
      kcalPerPortion: 350,
      amount: undefined,
      basis: undefined,
      photo: undefined,
    });
  });

  it('carries serving basis and portion weight into the edit', () => {
    const edited = draftToEntry(draft({ serving: 'hundred', kcal: '270', portion: '130' }));

    expect(edited).toMatchObject({ kcalPerPortion: 351, amount: 130, basis: { amount: 100, kcal: 270 } });
  });

  it('validates fields like the custom food form', () => {
    expect(draftToEntry(draft({ name: '' }))).toBeNull();
    expect(draftToEntry(draft({ kcal: '90.5' }))).toBeNull();
    expect(draftToEntry(draft({ serving: 'custom' }))).toBeNull();
  });
});

describe('nextEntry', () => {
  it('changes only edited fields and quantity', () => {
    const current = entry();

    expect(nextEntry(current, { name: 'Кофе с молоком', kcalPerPortion: 40 }, 2)).toEqual({
      ...current,
      name: 'Кофе с молоком',
      kcalPerPortion: 40,
      qty: 2,
    });
  });

  it('drops a removed portion weight', () => {
    const weighed = entry({ amount: 100, basis: { amount: 100, kcal: 5 } });
    const next = nextEntry(weighed, { name: 'Кофе', kcalPerPortion: 5 }, 1);

    expect(next.amount).toBeUndefined();
    expect(next.basis).toBeUndefined();
  });
});
