import { isBarcode, lookupBarcode, parsePackage, productToDraft, toProduct } from './barcode';

function response(status: number, product: Record<string, unknown> = {}) {
  return { status, product };
}

function cola(overrides: Record<string, unknown> = {}) {
  return response(1, {
    product_name: 'Coca-Cola',
    quantity: '330 ml',
    nutriments: { 'energy-kcal_100g': 42 },
    ...overrides,
  });
}

function gorilla(overrides: Record<string, unknown> = {}) {
  return response(1, {
    product_name: 'Gorilla energy drink',
    quantity: '450 ml',
    nutriscore_grade: 'e',
    nova_group: 4,
    nutriments: {
      'energy-kcal_100g': 50,
      'proteins_100g': 0,
      'fat_100g': 0,
      'saturated-fat_100g': 0,
      'carbohydrates_100g': 12,
      'sugars_100g': 12,
      'fiber_100g': 0,
      'salt_100g': 0,
    },
    ...overrides,
  });
}

function answers(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }));
}

describe('isBarcode', () => {
  it('accepts regular package codes', () => {
    expect(isBarcode('5449000000996')).toBe(true);
    expect(isBarcode('  8076809513692  ')).toBe(true);
  });

  it('rejects letters and numbers of wrong length', () => {
    expect(isBarcode('')).toBe(false);
    expect(isBarcode('1234')).toBe(false);
    expect(isBarcode('54490000009961234')).toBe(false);
    expect(isBarcode('544900000099a')).toBe(false);
  });
});

describe('parsePackage', () => {
  it('reads grams as written on packages', () => {
    expect(parsePackage('400g')).toEqual({ amount: 400, unit: 'g' });
    expect(parsePackage('300 g e')).toEqual({ amount: 300, unit: 'g' });
    expect(parsePackage('130 г')).toEqual({ amount: 130, unit: 'g' });
  });

  it('keeps drinks in millilitres', () => {
    expect(parsePackage('330 ml')).toEqual({ amount: 330, unit: 'ml' });
    expect(parsePackage('450 мл')).toEqual({ amount: 450, unit: 'ml' });
  });

  it('converts kilograms and litres', () => {
    expect(parsePackage('1,5 L')).toEqual({ amount: 1500, unit: 'ml' });
    expect(parsePackage('1 кг')).toEqual({ amount: 1000, unit: 'g' });
  });

  it('returns nothing when mass is missing or unit is unknown', () => {
    expect(parsePackage('')).toBeUndefined();
    expect(parsePackage('1 упаковка')).toBeUndefined();
    expect(parsePackage('несколько штук')).toBeUndefined();
  });

  it('returns nothing for implausible mass', () => {
    expect(parsePackage('0 г')).toBeUndefined();
    expect(parsePackage('25 кг')).toBeUndefined();
  });
});

describe('toProduct', () => {
  it('builds a product from the database response', () => {
    expect(toProduct(cola())).toEqual({
      name: 'Coca-Cola',
      kcalPerHundred: 42,
      amount: 330,
      unit: 'ml',
      nutrients: undefined,
      grades: undefined,
    });
  });

  it('leaves amount empty when the database has none', () => {
    expect(toProduct(cola({ quantity: '' }))?.amount).toBeUndefined();
  });

  it('treats product as sold by weight without a clear package', () => {
    expect(toProduct(cola({ quantity: '' }))?.unit).toBe('g');
  });

  it('rounds fractional calories', () => {
    expect(toProduct(cola({ nutriments: { 'energy-kcal_100g': 41.6 } }))?.kcalPerHundred).toBe(42);
  });

  it('falls back to brand when name is empty', () => {
    expect(toProduct(cola({ product_name: '', brands: 'Coca-Cola' }))?.name).toBe('Coca-Cola');
  });

  it('returns null when product is not in the database', () => {
    expect(toProduct(response(0))).toBeNull();
  });

  it('finds product even without calories in the database', () => {
    expect(toProduct(cola({ nutriments: {} }))).toMatchObject({ name: 'Coca-Cola', kcalPerHundred: undefined });
  });

  it('converts kilojoules when calories are missing', () => {
    expect(toProduct(cola({ nutriments: { 'energy-kj_100g': 1120 } }))?.kcalPerHundred).toBe(268);
  });

  it('leaves calories empty when the value is implausible', () => {
    expect(toProduct(cola({ nutriments: { 'energy-kcal_100g': 0 } }))?.kcalPerHundred).toBeUndefined();
  });

  it('leaves form calories field empty without calories', () => {
    expect(productToDraft(toProduct(cola({ nutriments: {} }))!).kcal).toBe('');
  });

  it('takes nutrients from the label', () => {
    expect(toProduct(gorilla())?.nutrients)
      .toEqual({ protein: 0, fat: 0, saturatedFat: 0, carbs: 12, sugars: 12, fiber: 0, salt: 0 });
  });

  it('takes Nutri-Score and NOVA', () => {
    expect(toProduct(gorilla())?.grades).toEqual({ nutriScore: 'e', nova: 4 });
  });

  it('skips unknown grades', () => {
    expect(toProduct(gorilla({ nutriscore_grade: 'unknown', nova_group: 9 }))?.grades).toBeUndefined();
  });

  it('invents no nutrients when label has none', () => {
    expect(toProduct(cola())?.nutrients).toBeUndefined();
  });

  it('returns null without a name', () => {
    expect(toProduct(cola({ product_name: '', brands: '' }))).toBeNull();
  });
});

describe('productToDraft', () => {
  it('maps product to form fields', () => {
    expect(productToDraft({ name: 'Coca-Cola', kcalPerHundred: 42, amount: 330, unit: 'ml' })).toEqual({
      name: 'Coca-Cola',
      serving: 'hundred',
      unit: 'ml',
      amount: '100',
      kcal: '42',
      portion: '330',
      photo: '',
    });
  });

  it('puts label nutrients into the draft', () => {
    const draft = productToDraft(toProduct(gorilla())!);

    expect(draft.nutrients).toMatchObject({ sugars: 12 });
    expect(draft.grades).toEqual({ nutriScore: 'e', nova: 4 });
  });

  it('leaves portion empty when amount is unknown', () => {
    expect(productToDraft({ name: 'Nutella', kcalPerHundred: 539, unit: 'g' }).portion).toBe('');
  });
});

describe('lookupBarcode', () => {
  it('finds product by code', async () => {
    answers(cola());

    expect(await lookupBarcode('5449000000996')).toEqual({
      state: 'found',
      product: {
        name: 'Coca-Cola',
        kcalPerHundred: 42,
        amount: 330,
        unit: 'ml',
        nutrients: undefined,
        grades: undefined,
      },
    });
  });

  it('queries the database by trimmed code', async () => {
    answers(cola());
    await lookupBarcode(' 5449000000996 ');

    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/5449000000996.json');
  });

  it('distinguishes missing product from connection loss', async () => {
    answers(response(0));
    expect(await lookupBarcode('0000000000000')).toEqual({ state: 'missing' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await lookupBarcode('5449000000996')).toEqual({ state: 'offline' });
  });

  it('treats non-JSON stub response as offline, not missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('not json')),
    }));

    expect(await lookupBarcode('5449000000996')).toEqual({ state: 'offline' });
  });

  it('treats 404 for unknown product as missing, not failure', async () => {
    answers({ status: 0, status_verbose: 'product not found' }, 404);

    expect(await lookupBarcode('4850006192263')).toEqual({ state: 'missing' });
  });

  it('treats server error as offline', async () => {
    answers(cola(), 500);

    expect(await lookupBarcode('5449000000996')).toEqual({ state: 'offline' });
  });

  it('treats rate limit as offline', async () => {
    answers({}, 429);

    expect(await lookupBarcode('5449000000996')).toEqual({ state: 'offline' });
  });
});
