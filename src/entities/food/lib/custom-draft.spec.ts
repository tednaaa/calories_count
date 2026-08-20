import type { CustomFood } from '@/shared/db';
import { draftFromCustomFood, draftToCustomFood, emptyCustomDraft, MAX_KCAL } from './custom-draft';

function draft(overrides: Partial<ReturnType<typeof emptyCustomDraft>> = {}) {
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

describe('draftToCustomFood', () => {
  it('собирает блюдо', () => {
    expect(draftToCustomFood(draft())).toEqual({
      name: 'Пирог',
      kcal: 350,
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
});

describe('draftFromCustomFood', () => {
  it('раскладывает сохранённое блюдо по полям формы', () => {
    expect(draftFromCustomFood(stored)).toEqual({
      name: 'Пирог у бабушки',
      kcal: '350',
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
      photo: stored.photo,
    });
  });
});
