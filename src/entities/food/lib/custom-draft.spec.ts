import type { CustomDraft } from './custom-draft';
import type { CustomFood } from '@/shared/db';
import {
  draftFromCustomFood,
  draftToCustomFood,
  emptyCustomDraft,
  MAX_GRAMS,
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
  grams: 130,
  basis: { grams: 100, kcal: 270 },
};

describe('draftToCustomFood', () => {
  it('собирает блюдо', () => {
    expect(draftToCustomFood(draft())).toEqual({
      name: 'Пирог',
      kcal: 350,
      grams: undefined,
      basis: undefined,
      photo: undefined,
    });
  });

  it('обрезает пробелы вокруг названия', () => {
    expect(draftToCustomFood(draft({ name: '  Пирог  ' }))?.name).toBe('Пирог');
  });

  it('прикладывает фото, когда оно выбрано', () => {
    expect(draftToCustomFood(draft({ photo: 'data:image/jpeg;base64,zzz' }))?.photo)
      .toBe('data:image/jpeg;base64,zzz');
  });

  it('на пустой форме ничего не собирает', () => {
    expect(draftToCustomFood(emptyCustomDraft())).toBeNull();
  });

  it('требует название', () => {
    expect(draftToCustomFood(draft({ name: '   ' }))).toBeNull();
  });

  it('требует калорийность', () => {
    expect(draftToCustomFood(draft({ kcal: '' }))).toBeNull();
  });

  it('не принимает нечисловую калорийность', () => {
    expect(draftToCustomFood(draft({ kcal: 'много' }))).toBeNull();
  });

  it('не принимает дробную калорийность', () => {
    expect(draftToCustomFood(draft({ kcal: '90.5' }))).toBeNull();
  });

  it('не принимает ноль и отрицательные', () => {
    expect(draftToCustomFood(draft({ kcal: '0' }))).toBeNull();
    expect(draftToCustomFood(draft({ kcal: '-100' }))).toBeNull();
  });

  it('отсекает опечатку в разряде', () => {
    expect(draftToCustomFood(draft({ kcal: String(MAX_KCAL + 1) }))).toBeNull();
  });

  it('таб «Порция» оставляет блюдо без граммовки', () => {
    const food = draftToCustomFood(draft({ serving: 'portion', grams: '30', portion: '130' }));

    expect(food?.grams).toBeUndefined();
    expect(food?.basis).toBeUndefined();
  });

  it('без веса порции порция равна базе', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', kcal: '270' }))).toMatchObject({
      kcal: 270,
      grams: 100,
      basis: { grams: 100, kcal: 270 },
    });
  });

  it('пересчитывает калорийность на вес порции', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', kcal: '270', portion: '130' }))).toMatchObject({
      kcal: 351,
      grams: 130,
      basis: { grams: 100, kcal: 270 },
    });
  });

  it('считает от своей базы, а не от сотни', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', grams: '30', kcal: '150', portion: '90' })))
      .toMatchObject({ kcal: 450, grams: 90, basis: { grams: 30, kcal: 150 } });
  });

  it('округляет калорийность порции до целых', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', kcal: '270', portion: '137' }))?.kcal).toBe(370);
  });

  it('на своей базе требует базовый вес', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', grams: '' }))).toBeNull();
  });

  it('не принимает нечисловой и дробный базовый вес', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', grams: 'пачка' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'custom', grams: '30.5' }))).toBeNull();
  });

  it('не принимает ноль и отрицательный базовый вес', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', grams: '0' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'custom', grams: '-30' }))).toBeNull();
  });

  it('не принимает битый вес порции', () => {
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: 'пачка' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: '130.5' }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: '0' }))).toBeNull();
  });

  it('отсекает опечатку в весе', () => {
    expect(draftToCustomFood(draft({ serving: 'custom', grams: String(MAX_GRAMS + 1) }))).toBeNull();
    expect(draftToCustomFood(draft({ serving: 'hundred', portion: String(MAX_GRAMS + 1) }))).toBeNull();
  });
});

describe('servingToDraft', () => {
  it('блюдо без граммовки открывается на табе «Порция»', () => {
    expect(servingToDraft({ kcal: 350 })).toEqual({ serving: 'portion', grams: '', kcal: '350', portion: '' });
  });

  it('сотня открывается на своём табе', () => {
    expect(servingToDraft({ kcal: 270, grams: 100, basis: { grams: 100, kcal: 270 } }))
      .toEqual({ serving: 'hundred', grams: '100', kcal: '270', portion: '' });
  });

  it('другая база открывается на табе «Своё»', () => {
    expect(servingToDraft({ kcal: 150, grams: 30, basis: { grams: 30, kcal: 150 } }))
      .toEqual({ serving: 'custom', grams: '30', kcal: '150', portion: '' });
  });

  it('возвращает в форму этикетку, а не пересчитанную порцию', () => {
    expect(servingToDraft(cheese)).toEqual({ serving: 'hundred', grams: '100', kcal: '270', portion: '130' });
  });

  it('блюдо с граммовкой, но без этикетки читается как база', () => {
    expect(servingToDraft({ kcal: 270, grams: 100 }))
      .toEqual({ serving: 'hundred', grams: '100', kcal: '270', portion: '' });
  });
});

describe('draftFromCustomFood', () => {
  it('раскладывает сохранённое блюдо по полям формы', () => {
    expect(draftFromCustomFood(stored)).toEqual({
      name: 'Пирог у бабушки',
      serving: 'portion',
      grams: '',
      kcal: '350',
      portion: '',
      photo: 'data:image/jpeg;base64,zzz',
    });
  });

  it('блюдо без фото открывается с пустым полем', () => {
    expect(draftFromCustomFood({ ...stored, photo: undefined }).photo).toBe('');
  });

  it('пережёвывает круг «прочитал — записал» без потерь', () => {
    expect(draftToCustomFood(draftFromCustomFood(stored))).toEqual({
      name: stored.name,
      kcal: stored.kcal,
      grams: undefined,
      basis: undefined,
      photo: stored.photo,
    });
  });

  it('круг не теряет ни этикетку, ни вес порции', () => {
    expect(draftToCustomFood(draftFromCustomFood(cheese))).toMatchObject({
      kcal: 351,
      grams: 130,
      basis: { grams: 100, kcal: 270 },
    });
  });
});
