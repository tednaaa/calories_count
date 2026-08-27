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

function answers(body: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }));
}

describe('isBarcode', () => {
  it('принимает обычные коды с упаковки', () => {
    expect(isBarcode('5449000000996')).toBe(true);
    expect(isBarcode('  8076809513692  ')).toBe(true);
  });

  it('отсекает буквы и слишком короткие числа', () => {
    expect(isBarcode('')).toBe(false);
    expect(isBarcode('1234')).toBe(false);
    expect(isBarcode('54490000009961234')).toBe(false);
    expect(isBarcode('544900000099a')).toBe(false);
  });
});

describe('parsePackage', () => {
  it('читает граммы, как их пишут на упаковках', () => {
    expect(parsePackage('400g')).toEqual({ amount: 400, unit: 'g' });
    expect(parsePackage('300 g e')).toEqual({ amount: 300, unit: 'g' });
    expect(parsePackage('130 г')).toEqual({ amount: 130, unit: 'g' });
  });

  it('оставляет напитки в миллилитрах', () => {
    expect(parsePackage('330 ml')).toEqual({ amount: 330, unit: 'ml' });
    expect(parsePackage('450 мл')).toEqual({ amount: 450, unit: 'ml' });
  });

  it('переводит килограммы и литры', () => {
    expect(parsePackage('1,5 L')).toEqual({ amount: 1500, unit: 'ml' });
    expect(parsePackage('1 кг')).toEqual({ amount: 1000, unit: 'g' });
  });

  it('молчит, когда массы нет или единица непонятная', () => {
    expect(parsePackage('')).toBeUndefined();
    expect(parsePackage('1 упаковка')).toBeUndefined();
    expect(parsePackage('несколько штук')).toBeUndefined();
  });

  it('молчит на бессмысленной массе', () => {
    expect(parsePackage('0 г')).toBeUndefined();
    expect(parsePackage('25 кг')).toBeUndefined();
  });
});

describe('toProduct', () => {
  it('собирает продукт из ответа базы', () => {
    expect(toProduct(cola())).toEqual({
      name: 'Coca-Cola',
      kcalPerHundred: 42,
      amount: 330,
      unit: 'ml',
      nutrients: undefined,
      grades: undefined,
    });
  });

  it('оставляет массу пустой, когда её нет в базе', () => {
    expect(toProduct(cola({ quantity: '' }))?.amount).toBeUndefined();
  });

  it('без понятной упаковки считает продукт весовым', () => {
    expect(toProduct(cola({ quantity: '' }))?.unit).toBe('g');
  });

  it('округляет дробную калорийность', () => {
    expect(toProduct(cola({ nutriments: { 'energy-kcal_100g': 41.6 } }))?.kcalPerHundred).toBe(42);
  });

  it('берёт бренд, когда название пустое', () => {
    expect(toProduct(cola({ product_name: '', brands: 'Coca-Cola' }))?.name).toBe('Coca-Cola');
  });

  it('ничего не собирает, когда товара в базе нет', () => {
    expect(toProduct(response(0))).toBeNull();
  });

  it('ничего не собирает без калорийности', () => {
    expect(toProduct(cola({ nutriments: {} }))).toBeNull();
    expect(toProduct(cola({ nutriments: { 'energy-kcal_100g': 0 } }))).toBeNull();
  });

  it('забирает состав с этикетки', () => {
    expect(toProduct(gorilla())?.nutrients)
      .toEqual({ protein: 0, fat: 0, saturatedFat: 0, carbs: 12, sugars: 12, fiber: 0, salt: 0 });
  });

  it('забирает Nutri-Score и NOVA', () => {
    expect(toProduct(gorilla())?.grades).toEqual({ nutriScore: 'e', nova: 4 });
  });

  it('пропускает незнакомые бейджи', () => {
    expect(toProduct(gorilla({ nutriscore_grade: 'unknown', nova_group: 9 }))?.grades).toBeUndefined();
  });

  it('без состава ничего не выдумывает', () => {
    expect(toProduct(cola())?.nutrients).toBeUndefined();
  });

  it('ничего не собирает без названия', () => {
    expect(toProduct(cola({ product_name: '', brands: '' }))).toBeNull();
  });
});

describe('productToDraft', () => {
  it('раскладывает товар по полям формы', () => {
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

  it('кладёт состав этикетки в черновик', () => {
    const draft = productToDraft(toProduct(gorilla())!);

    expect(draft.nutrients).toMatchObject({ sugars: 12 });
    expect(draft.grades).toEqual({ nutriScore: 'e', nova: 4 });
  });

  it('оставляет вес порции пустым, когда масса неизвестна', () => {
    expect(productToDraft({ name: 'Nutella', kcalPerHundred: 539, unit: 'g' }).portion).toBe('');
  });
});

describe('lookupBarcode', () => {
  it('находит товар по коду', async () => {
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

  it('спрашивает базу по самому коду', async () => {
    answers(cola());
    await lookupBarcode(' 5449000000996 ');

    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/5449000000996.json');
  });

  it('отличает отсутствие товара от обрыва связи', async () => {
    answers(response(0));
    expect(await lookupBarcode('0000000000000')).toEqual({ state: 'missing' });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await lookupBarcode('5449000000996')).toEqual({ state: 'offline' });
  });

  it('не падает на мусоре вместо ответа', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('not json')),
    }));

    expect(await lookupBarcode('5449000000996')).toEqual({ state: 'missing' });
  });

  it('считает ошибку сервера обрывом связи', async () => {
    answers(cola(), false);

    expect(await lookupBarcode('5449000000996')).toEqual({ state: 'offline' });
  });
});
