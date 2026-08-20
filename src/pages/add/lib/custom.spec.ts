import { draftToCustomItem, emptyCustomDraft, MAX_KCAL } from './custom';

function draft(overrides: Partial<ReturnType<typeof emptyCustomDraft>> = {}) {
  return { ...emptyCustomDraft(), name: 'Пирог', kcal: '350', ...overrides };
}

describe('draftToCustomItem', () => {
  it('собирает разовое блюдо', () => {
    expect(draftToCustomItem(draft())).toEqual({
      name: 'Пирог',
      kcalPerPortion: 350,
      photo: undefined,
    });
  });

  it('обрезает пробелы вокруг названия', () => {
    expect(draftToCustomItem(draft({ name: '  Пирог  ' }))?.name).toBe('Пирог');
  });

  it('прикладывает фото, когда оно выбрано', () => {
    expect(draftToCustomItem(draft({ photo: 'data:image/jpeg;base64,zzz' }))?.photo)
      .toBe('data:image/jpeg;base64,zzz');
  });

  it('на пустой форме ничего не собирает', () => {
    expect(draftToCustomItem(emptyCustomDraft())).toBeNull();
  });

  it('требует название', () => {
    expect(draftToCustomItem(draft({ name: '   ' }))).toBeNull();
  });

  it('требует калорийность', () => {
    expect(draftToCustomItem(draft({ kcal: '' }))).toBeNull();
  });

  it('не принимает нечисловую калорийность', () => {
    expect(draftToCustomItem(draft({ kcal: 'много' }))).toBeNull();
  });

  it('не принимает дробную калорийность', () => {
    expect(draftToCustomItem(draft({ kcal: '90.5' }))).toBeNull();
  });

  it('не принимает ноль и отрицательные', () => {
    expect(draftToCustomItem(draft({ kcal: '0' }))).toBeNull();
    expect(draftToCustomItem(draft({ kcal: '-100' }))).toBeNull();
  });

  it('отсекает опечатку в разряде', () => {
    expect(draftToCustomItem(draft({ kcal: String(MAX_KCAL + 1) }))).toBeNull();
  });
});
