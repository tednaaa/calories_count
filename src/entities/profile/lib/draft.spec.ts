import type { Profile } from '@/shared/db';
import { draftFromProfile, draftsEqual, draftToInput, emptyDraft, hasInvalidTargetWeight } from './draft';

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'me',
    sex: 'male',
    age: 30,
    heightCm: 180,
    weightKg: 85,
    activity: 'moderate',
    goal: 'cutMild',
    targetKcal: 2410,
    targetOverridden: false,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('draftFromProfile', () => {
  it('переводит числа профиля в строки полей ввода', () => {
    expect(draftFromProfile(profile())).toEqual({
      sex: 'male',
      age: '30',
      heightCm: '180',
      weightKg: '85',
      targetWeightKg: '',
      activity: 'moderate',
      goal: 'cutMild',
    });
  });

  it('пишет дробный вес через запятую', () => {
    expect(draftFromProfile(profile({ weightKg: 85.4 })).weightKg).toBe('85,4');
  });
});

describe('draftToInput', () => {
  it('собирает данные для расчёта из заполненной формы', () => {
    expect(draftToInput(draftFromProfile(profile()))).toEqual({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 85,
      activity: 'moderate',
      goal: 'cutMild',
    });
  });

  it('пустая форма ничего не даёт', () => {
    expect(draftToInput(emptyDraft())).toBeNull();
  });

  it('отвергает значения за пределами разумного', () => {
    const draft = draftFromProfile(profile());

    expect(draftToInput({ ...draft, age: '7' })).toBeNull();
    expect(draftToInput({ ...draft, heightCm: '400' })).toBeNull();
    expect(draftToInput({ ...draft, weightKg: '5' })).toBeNull();
  });

  it('понимает вес с запятой', () => {
    expect(draftToInput({ ...draftFromProfile(profile()), weightKg: '85,4' })?.weightKg).toBe(85.4);
  });

  it('целевой вес необязателен', () => {
    expect(draftToInput(draftFromProfile(profile()))).not.toHaveProperty('targetWeightKg');
  });

  it('берёт целевой вес с запятой', () => {
    expect(draftToInput({ ...draftFromProfile(profile()), targetWeightKg: '78,5' })?.targetWeightKg).toBe(78.5);
  });

  it('целевой вес вне пределов не ломает расчёт нормы, но и не сохраняется', () => {
    const draft = { ...draftFromProfile(profile()), targetWeightKg: '12' };

    expect(draftToInput(draft)).not.toHaveProperty('targetWeightKg');
    expect(draftToInput(draft)?.weightKg).toBe(85);
    expect(hasInvalidTargetWeight(draft)).toBe(true);
  });

  it('пустой целевой вес — не ошибка', () => {
    expect(hasInvalidTargetWeight(draftFromProfile(profile()))).toBe(false);
  });

  it('отвергает нечисловой ввод', () => {
    expect(draftToInput({ ...draftFromProfile(profile()), weightKg: 'много' })).toBeNull();
  });
});

describe('draftsEqual', () => {
  it('одинаковые формы считает одинаковыми', () => {
    expect(draftsEqual(draftFromProfile(profile()), draftFromProfile(profile()))).toBe(true);
  });

  it('замечает изменение любого поля', () => {
    const draft = draftFromProfile(profile());

    expect(draftsEqual(draft, { ...draft, weightKg: '84' })).toBe(false);
    expect(draftsEqual(draft, { ...draft, goal: 'bulk' })).toBe(false);
    expect(draftsEqual(draft, { ...draft, sex: 'female' })).toBe(false);
  });
});
