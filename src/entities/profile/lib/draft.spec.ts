import type { Profile } from '@/shared/db';
import { toDateKey, yearsBefore } from '@/shared/lib';
import { draftFromProfile, draftsEqual, draftToInput, emptyDraft, hasInvalidTargetWeight } from './draft';

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'me',
    sex: 'male',
    birthDate: yearsBefore(toDateKey(), 30),
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
  it('converts profile numbers to input strings', () => {
    expect(draftFromProfile(profile())).toEqual({
      sex: 'male',
      birthDate: yearsBefore(toDateKey(), 30),
      heightCm: '180',
      weightKg: '85',
      targetWeightKg: '',
      activity: 'moderate',
      goal: 'cutMild',
    });
  });

  it('writes fractional weight with a comma', () => {
    expect(draftFromProfile(profile({ weightKg: 85.4 })).weightKg).toBe('85,4');
  });
});

describe('draftToInput', () => {
  it('builds calculation input from a filled form', () => {
    expect(draftToInput(draftFromProfile(profile()))).toEqual({
      sex: 'male',
      birthDate: yearsBefore(toDateKey(), 30),
      heightCm: 180,
      weightKg: 85,
      activity: 'moderate',
      goal: 'cutMild',
    });
  });

  it('returns null for an empty form', () => {
    expect(draftToInput(emptyDraft())).toBeNull();
  });

  it('rejects values out of range', () => {
    const draft = draftFromProfile(profile());

    expect(draftToInput({ ...draft, birthDate: yearsBefore(toDateKey(), 7) })).toBeNull();
    expect(draftToInput({ ...draft, heightCm: '400' })).toBeNull();
    expect(draftToInput({ ...draft, weightKg: '5' })).toBeNull();
  });

  it('accepts weight with a comma', () => {
    expect(draftToInput({ ...draftFromProfile(profile()), weightKg: '85,4' })?.weightKg).toBe(85.4);
  });

  it('treats target weight as optional', () => {
    expect(draftToInput(draftFromProfile(profile()))).not.toHaveProperty('targetWeightKg');
  });

  it('accepts target weight with a comma', () => {
    expect(draftToInput({ ...draftFromProfile(profile()), targetWeightKg: '78,5' })?.targetWeightKg).toBe(78.5);
  });

  it('drops out-of-range target weight without breaking the calculation', () => {
    const draft = { ...draftFromProfile(profile()), targetWeightKg: '12' };

    expect(draftToInput(draft)).not.toHaveProperty('targetWeightKg');
    expect(draftToInput(draft)?.weightKg).toBe(85);
    expect(hasInvalidTargetWeight(draft)).toBe(true);
  });

  it('does not treat empty target weight as invalid', () => {
    expect(hasInvalidTargetWeight(draftFromProfile(profile()))).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(draftToInput({ ...draftFromProfile(profile()), weightKg: 'много' })).toBeNull();
  });
});

describe('draftsEqual', () => {
  it('treats identical forms as equal', () => {
    expect(draftsEqual(draftFromProfile(profile()), draftFromProfile(profile()))).toBe(true);
  });

  it('detects a change in any field', () => {
    const draft = draftFromProfile(profile());

    expect(draftsEqual(draft, { ...draft, weightKg: '84' })).toBe(false);
    expect(draftsEqual(draft, { ...draft, goal: 'bulk' })).toBe(false);
    expect(draftsEqual(draft, { ...draft, sex: 'female' })).toBe(false);
  });
});
