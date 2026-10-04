import type { ProfileInput } from './profile';
import type { Profile } from '@/shared/db';
import { toDateKey, yearsBefore } from '@/shared/lib';
import { calcTarget } from './calories';
import { nextProfile, withCalculatedTarget, withCalibration, withManualTarget, withoutCalibration, withWeight } from './profile';

const input: ProfileInput = {
  sex: 'male',
  birthDate: yearsBefore(toDateKey(), 30),
  heightCm: 180,
  weightKg: 85,
  activity: 'moderate',
  goal: 'cutMild',
};

const NOW = 1_770_000_000_000;

describe('nextProfile', () => {
  it('считает норму, когда профиля ещё нет', () => {
    const profile = nextProfile(undefined, input, NOW);

    expect(profile.targetKcal).toBe(calcTarget(input).target);
    expect(profile.targetOverridden).toBe(false);
  });

  it('сохраняет дату создания и обновляет дату правки', () => {
    const created = nextProfile(undefined, input, NOW);
    const updated = nextProfile(created, { ...input, weightKg: 83 }, NOW + 1000);

    expect(updated.createdAt).toBe(NOW);
    expect(updated.updatedAt).toBe(NOW + 1000);
  });

  it('пересчитывает норму при изменении веса', () => {
    const created = nextProfile(undefined, input, NOW);
    const updated = nextProfile(created, { ...input, weightKg: 75 }, NOW + 1000);

    expect(updated.targetKcal).toBeLessThan(created.targetKcal);
  });

  it('не трогает норму, заданную вручную', () => {
    const manual = withManualTarget(nextProfile(undefined, input, NOW), 2000, NOW);
    const updated = nextProfile(manual, { ...input, weightKg: 75 }, NOW + 1000);

    expect(updated.targetKcal).toBe(2000);
    expect(updated.targetOverridden).toBe(true);
  });
});

describe('withManualTarget', () => {
  it('фиксирует норму и поднимает флаг', () => {
    const profile = withManualTarget(nextProfile(undefined, input, NOW), 2222, NOW + 1);

    expect(profile.targetKcal).toBe(2222);
    expect(profile.targetOverridden).toBe(true);
    expect(profile.updatedAt).toBe(NOW + 1);
  });
});

describe('withCalculatedTarget', () => {
  it('возвращает расчётную норму и снимает флаг', () => {
    const manual: Profile = withManualTarget(nextProfile(undefined, input, NOW), 2222, NOW);
    const restored = withCalculatedTarget(manual, NOW + 1);

    expect(restored.targetKcal).toBe(calcTarget(input).target);
    expect(restored.targetOverridden).toBe(false);
  });
});

describe('withCalibration', () => {
  it('поправляет расход и считает норму от него', () => {
    const calibrated = withCalibration(nextProfile(undefined, input, NOW), -216, NOW + 1);

    expect(calibrated.targetKcal).toBe(calcTarget({ ...input, tdeeCorrectionKcal: -216 }).target);
    expect(calibrated.calibratedAt).toBe(NOW + 1);
  });

  it('возвращает норму из ручного режима в расчётный', () => {
    const manual = withManualTarget(nextProfile(undefined, input, NOW), 2000, NOW);

    expect(withCalibration(manual, -216, NOW + 1).targetOverridden).toBe(false);
  });

  it('поправка переживает новый вес, и норма продолжает пересчитываться', () => {
    const calibrated = withCalibration(nextProfile(undefined, input, NOW), -216, NOW + 1);
    const updated = nextProfile(calibrated, withWeight(calibrated, 80), NOW + 2);

    expect(updated.tdeeCorrectionKcal).toBe(-216);
    expect(updated.calibratedAt).toBe(NOW + 1);
    expect(updated.targetKcal).toBe(calcTarget({ ...input, weightKg: 80, tdeeCorrectionKcal: -216 }).target);
  });
});

describe('withoutCalibration', () => {
  it('убирает поправку и возвращает норму по формуле', () => {
    const calibrated = withCalibration(nextProfile(undefined, input, NOW), -216, NOW + 1);
    const reset = withoutCalibration(calibrated, NOW + 2);

    expect(reset.targetKcal).toBe(calcTarget(input).target);
    expect(reset).not.toHaveProperty('tdeeCorrectionKcal');
    expect(reset).not.toHaveProperty('calibratedAt');
  });
});

describe('withWeight', () => {
  it('берёт из профиля всё, кроме веса', () => {
    const profile = nextProfile(undefined, input, NOW);

    expect(withWeight(profile, 83.4)).toEqual({ ...input, weightKg: 83.4 });
  });

  it('пересчитывает норму от нового веса', () => {
    const profile = nextProfile(undefined, input, NOW);
    const updated = nextProfile(profile, withWeight(profile, 75), NOW + 1);

    expect(updated.targetKcal).toBe(calcTarget({ ...input, weightKg: 75 }).target);
  });
});
