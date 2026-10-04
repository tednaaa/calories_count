import type { CustomDraft } from './custom-draft';
import type { CustomFood } from '@/shared/db';
import {
  draftFromCustomFood,
  draftToCustomFood,
  emptyCustomDraft,
  MAX_AMOUNT,
  MAX_KCAL,
  servingToDraft,
} from './custom-draft';

function draft(overrides: Partial<CustomDraft> = {}): CustomDraft {
  return { ...emptyCustomDraft(), name: 'Пирог', kcal: '350', ...overrides };
}

const stored: CustomFood = {
  id: 'pie',
  name: 'Пирог у бабушки',
  kcal: 350,
  photo: 'data:image/jpeg;base64,zzz',
  createdAt: 1_770_000_000_000,
  updatedAt: 1_770_000_000_000,
};

const cheese: CustomFood = {
  ...stored,
  id: 'cheese',
  name: 'Сыр для чизбургера',
  kcal: 351,
  amount: 130,
  basis: { amount: 100, kcal: 270 },
};

describe('draftToCustomFood', () => {
  it('builds the food', () => {
    expect(draftToCustomFood(draft())).toEqual({
      name: 'Пирог',
      kcal: 350,
      amount: undefined,
      basis: undefined,
      photo: undefined,
    });
  });

  it('trims whitespace around the name', () => {
    expect(draftToCustomFood(draft({ name: '  Пирог  ' }))?.name).toBe('Пирог');
  });

  it('attaches the photo when selected', () => {
    expect(draftToCustomFood(draft({ photo: 'data:image/jpeg;base64,zzz' }))?.photo)
      .toBe('data:image/jpeg;base64,zzz');
  });

  it('returns null for an empty form', () => {
    expect(draftToCustomFood(emptyCustomDraft())).toBeNull();
  });

  it('requires a name', () => {
    expect(draftToCustomFood(draft({ name: '   ' }))).toBeNull();
  });

  it('requires calories', () => {
    expect(draftToCustomFood(draft({ kcal: '' }))).toBeNull();
  });

  it('rejects non-numeric calories', () => {
    expect(draftToCustomFood(draft({ kcal: 'много' }))).toBeNull();
  });

  it('rejects fractional calories', () => {
    expect(draftToCustomFood(draft({ kcal: '90.5' }))).toBeNull();
  });

  it('rejects zero and negatives', () => {
    expect(draftToCustomFood(draft({ kcal: '0' }))).toBeNull();
    expect(draftToCustomFood(draft({ kcal: '-100' }))).toBeNull();
  });

  it('rejects calories over the limit', () => {
    expect(draftToCustomFood(draft({ kcal: String(MAX_KCAL + 1) }))).toBeNull();
  });

  it('leaves the food without weight on the portion tab', () => {
    const food = draftToCustomFood(draft({ serving: 'portion', amount: '30', portion: '130' }));

    expect(food?.amount).toBeUndefined();
    expect(food?.basis).toBeUndefined();
  });

  it('uses the basis as the portion when portion weight is empty', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', kcal: '270' }))).toMatchObject({
      kcal: 270,
      amount: 100,
      basis: { amount: 100, kcal: 270 },
    });
  });

  it('scales calories to the portion weight', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', kcal: '270', portion: '130' }))).toMatchObject({
      kcal: 351,
      amount: 130,
      basis: { amount: 100, kcal: 270 },
    });
  });

  it('scales from a custom basis, not from 100', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', amount: '30', kcal: '150', portion: '90' })))
      .toMatchObject({ kcal: 450, amount: 90, basis: { amount: 30, kcal: 150 } });
  });

  it('rounds portion calories to integers', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', kcal: '270', portion: '137' }))?.kcal).toBe(370);
  });

  it('keeps the selected unit', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', unit: 'ml', kcal: '51', portion: '450' })))
      .toMatchObject({ kcal: 230, amount: 450, unit: 'ml', basis: { amount: 100, kcal: 51 } });
  });

  it('omits the unit for a portion without weight', () => {
    expect(draftToCustomFood(draft({ serving: 'portion', unit: 'ml' }))?.unit).toBeUndefined();
  });

  it('scales nutrients with the portion', () => {
    const drink = draft({ serving: 'hundred', unit: 'ml', kcal: '50', portion: '450', nutrients: { sugars: 12 } });

    expect(draftToCustomFood(drink)).toMatchObject({
      nutrients: { sugars: 54 },
      basis: { amount: 100, kcal: 50, nutrients: { sugars: 12 } },
    });
  });

  it('keeps the barcode on the food', () => {
    expect(draftToCustomFood(draft({ barcode: '4607065608873' }))?.barcode).toBe('4607065608873');
  });

  it('carries grades as is', () => {
    const scored = draft({ serving: 'hundred', kcal: '50', grades: { nutriScore: 'e', nova: 4 } });

    expect(draftToCustomFood(scored)?.grades).toEqual({ nutriScore: 'e', nova: 4 });
  });

  it('requires basis weight on a custom basis', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', amount: '' }))).toBeNull();
  });

  it('rejects non-numeric and fractional basis weight', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', amount: 'пачка' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'custom', amount: '30.5' }))).toBeNull();
  });

  it('rejects zero and negative basis weight', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', amount: '0' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'custom', amount: '-30' }))).toBeNull();
  });

  it('rejects invalid portion weight', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: 'пачка' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: '130.5' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: '0' }))).toBeNull();
  });

  it('rejects weight over the limit', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', amount: String(MAX_AMOUNT + 1) }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: String(MAX_AMOUNT + 1) }))).toBeNull();
  });
});

describe('servingToDraft', () => {
  it('opens a food without weight on the portion tab', () => {
    expect(servingToDraft({ kcal: 350 }))
      .toEqual({ serving: 'portion', unit: 'g', amount: '', kcal: '350', portion: '' });
  });

  it('opens a per-100 basis on its tab', () => {
    expect(servingToDraft({ kcal: 270, amount: 100, basis: { amount: 100, kcal: 270 } }))
      .toEqual({ serving: 'hundred', unit: 'g', amount: '100', kcal: '270', portion: '' });
  });

  it('opens another basis on the custom tab', () => {
    expect(servingToDraft({ kcal: 150, amount: 30, basis: { amount: 30, kcal: 150 } }))
      .toEqual({ serving: 'custom', unit: 'g', amount: '30', kcal: '150', portion: '' });
  });

  it('restores the label values, not the scaled portion', () => {
    expect(servingToDraft(cheese))
      .toEqual({ serving: 'hundred', unit: 'g', amount: '100', kcal: '270', portion: '130' });
  });

  it('opens a drink in milliliters', () => {
    expect(servingToDraft({ kcal: 230, amount: 450, unit: 'ml', basis: { amount: 100, kcal: 51 } }))
      .toEqual({ serving: 'hundred', unit: 'ml', amount: '100', kcal: '51', portion: '450' });
  });

  it('reads a weighed food without a label as the basis', () => {
    expect(servingToDraft({ kcal: 270, amount: 100 }))
      .toEqual({ serving: 'hundred', unit: 'g', amount: '100', kcal: '270', portion: '' });
  });
});

describe('draftFromCustomFood', () => {
  it('maps the stored food to form fields', () => {
    expect(draftFromCustomFood(stored)).toEqual({
      name: 'Пирог у бабушки',
      serving: 'portion',
      unit: 'g',
      amount: '',
      kcal: '350',
      portion: '',
      photo: 'data:image/jpeg;base64,zzz',
    });
  });

  it('opens a food without a photo with an empty field', () => {
    expect(draftFromCustomFood({ ...stored, photo: undefined }).photo).toBe('');
  });

  it('survives a read-write round trip losslessly', () => {
    expect(draftToCustomFood(draftFromCustomFood(stored))).toEqual({
      name: stored.name,
      kcal: stored.kcal,
      amount: undefined,
      basis: undefined,
      photo: stored.photo,
    });
  });

  it('keeps the barcode through the round trip', () => {
    const scanned: CustomFood = { ...stored, barcode: '4607065608873' };

    expect(draftToCustomFood(draftFromCustomFood(scanned))?.barcode).toBe('4607065608873');
  });

  it('keeps nutrients and grades through the round trip', () => {
    const drink: CustomFood = {
      ...stored,
      kcal: 225,
      amount: 450,
      unit: 'ml',
      basis: { amount: 100, kcal: 50, nutrients: { sugars: 12 } },
      nutrients: { sugars: 54 },
      grades: { nutriScore: 'e', nova: 4 },
    };

    expect(draftToCustomFood(draftFromCustomFood(drink))).toMatchObject({
      nutrients: { sugars: 54 },
      grades: { nutriScore: 'e', nova: 4 },
    });
  });

  it('keeps the label and portion weight through the round trip', () => {
    expect(draftToCustomFood(draftFromCustomFood(cheese))).toMatchObject({
      kcal: 351,
      amount: 130,
      basis: { amount: 100, kcal: 270 },
    });
  });
});
