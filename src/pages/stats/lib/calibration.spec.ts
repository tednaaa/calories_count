import type { Impact } from './impact';
import type { Profile } from '@/shared/db';
import { toDateKey, yearsBefore } from '@/shared/lib';
import { offerCalibration } from './calibration';

const TODAY = '2026-10-28';

const impact: Impact = {
  weighIns: 9,
  trackedDays: 27,
  countedDays: 27,
  coverage: 1,
  averageIntake: 2400,
  expectedPerWeek: -0.4,
  actualPerWeek: -0.2,
  realTdee: 2620,
  realTdeeError: 238,
  projection: null,
};

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
    createdAt: new Date(2026, 8, 1).getTime(),
    updatedAt: 0,
    ...overrides,
  };
}

describe('offerCalibration', () => {
  it('предлагает норму под цель по реальному расходу', () => {
    expect(offerCalibration(impact, profile(), TODAY)).toMatchObject({ kind: 'offer', ideal: 2230, next: 2230 });
  });

  it('после уточнения ждёт месяц, а не предлагает следующий шаг сразу', () => {
    const calibrated = profile({ calibratedAt: new Date(2026, 9, 20).getTime() });

    expect(offerCalibration({ ...impact, realTdee: 2200 }, calibrated, TODAY)).toEqual({ kind: 'recent', daysLeft: 20 });
  });

  it('через месяц после уточнения снова предлагает норму', () => {
    const calibrated = profile({ calibratedAt: new Date(2026, 8, 30).getTime() });

    expect(offerCalibration(impact, calibrated, TODAY)).toMatchObject({ kind: 'offer' });
  });

  it('молчит первые 14 дней — вес уходит с водой', () => {
    expect(offerCalibration(impact, profile({ createdAt: new Date(2026, 9, 20).getTime() }), TODAY))
      .toEqual({ kind: 'early', daysLeft: 6 });
  });

  it('просит взвешиваний, пока их меньше восьми', () => {
    expect(offerCalibration({ ...impact, weighIns: 5 }, profile(), TODAY)).toEqual({ kind: 'fewWeighIns', missing: 3 });
  });

  it('не уточняет норму по дырявым записям еды', () => {
    expect(offerCalibration({ ...impact, coverage: 0.6 }, profile(), TODAY)).toEqual({ kind: 'patchyFood' });
  });

  it('при разнице меньше 50 ккал говорит, что норма уже точная', () => {
    expect(offerCalibration({ ...impact, realTdee: 2860 }, profile(), TODAY)).toEqual({ kind: 'precise' });
  });

  it('не предлагает опускаться ниже безопасного минимума', () => {
    const atFloor = profile({ sex: 'female', goal: 'cut', targetKcal: 1200 });

    expect(offerCalibration({ ...impact, realTdee: 1300 }, atFloor, TODAY)).toEqual({ kind: 'atMinimum' });
  });
});
