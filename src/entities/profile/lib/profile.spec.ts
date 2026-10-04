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
  it('computes the target when there is no profile yet', () => {
    const profile = nextProfile(undefined, input, NOW);

    expect(profile.targetKcal).toBe(calcTarget(input).target);
    expect(profile.targetOverridden).toBe(false);
  });

  it('keeps createdAt and updates updatedAt', () => {
    const created = nextProfile(undefined, input, NOW);
    const updated = nextProfile(created, { ...input, weightKg: 83 }, NOW + 1000);

    expect(updated.createdAt).toBe(NOW);
    expect(updated.updatedAt).toBe(NOW + 1000);
  });

  it('recalculates the target when weight changes', () => {
    const created = nextProfile(undefined, input, NOW);
    const updated = nextProfile(created, { ...input, weightKg: 75 }, NOW + 1000);

    expect(updated.targetKcal).toBeLessThan(created.targetKcal);
  });

  it('keeps a manually set target', () => {
    const manual = withManualTarget(nextProfile(undefined, input, NOW), 2000, NOW);
    const updated = nextProfile(manual, { ...input, weightKg: 75 }, NOW + 1000);

    expect(updated.targetKcal).toBe(2000);
    expect(updated.targetOverridden).toBe(true);
  });
});

describe('withManualTarget', () => {
  it('pins the target and sets the override flag', () => {
    const profile = withManualTarget(nextProfile(undefined, input, NOW), 2222, NOW + 1);

    expect(profile.targetKcal).toBe(2222);
    expect(profile.targetOverridden).toBe(true);
    expect(profile.updatedAt).toBe(NOW + 1);
  });
});

describe('withCalculatedTarget', () => {
  it('restores the calculated target and clears the override flag', () => {
    const manual: Profile = withManualTarget(nextProfile(undefined, input, NOW), 2222, NOW);
    const restored = withCalculatedTarget(manual, NOW + 1);

    expect(restored.targetKcal).toBe(calcTarget(input).target);
    expect(restored.targetOverridden).toBe(false);
  });
});

describe('withCalibration', () => {
  it('corrects expenditure and derives the target from it', () => {
    const calibrated = withCalibration(nextProfile(undefined, input, NOW), -216, NOW + 1);

    expect(calibrated.targetKcal).toBe(calcTarget({ ...input, tdeeCorrectionKcal: -216 }).target);
    expect(calibrated.calibratedAt).toBe(NOW + 1);
  });

  it('switches the target from manual back to calculated', () => {
    const manual = withManualTarget(nextProfile(undefined, input, NOW), 2000, NOW);

    expect(withCalibration(manual, -216, NOW + 1).targetOverridden).toBe(false);
  });

  it('keeps the correction across a new weight and keeps recalculating the target', () => {
    const calibrated = withCalibration(nextProfile(undefined, input, NOW), -216, NOW + 1);
    const updated = nextProfile(calibrated, withWeight(calibrated, 80), NOW + 2);

    expect(updated.tdeeCorrectionKcal).toBe(-216);
    expect(updated.calibratedAt).toBe(NOW + 1);
    expect(updated.targetKcal).toBe(calcTarget({ ...input, weightKg: 80, tdeeCorrectionKcal: -216 }).target);
  });
});

describe('withoutCalibration', () => {
  it('removes the correction and restores the formula target', () => {
    const calibrated = withCalibration(nextProfile(undefined, input, NOW), -216, NOW + 1);
    const reset = withoutCalibration(calibrated, NOW + 2);

    expect(reset.targetKcal).toBe(calcTarget(input).target);
    expect(reset).not.toHaveProperty('tdeeCorrectionKcal');
    expect(reset).not.toHaveProperty('calibratedAt');
  });
});

describe('withWeight', () => {
  it('takes everything but weight from the profile', () => {
    const profile = nextProfile(undefined, input, NOW);

    expect(withWeight(profile, 83.4)).toEqual({ ...input, weightKg: 83.4 });
  });

  it('recalculates the target from the new weight', () => {
    const profile = nextProfile(undefined, input, NOW);
    const updated = nextProfile(profile, withWeight(profile, 75), NOW + 1);

    expect(updated.targetKcal).toBe(calcTarget({ ...input, weightKg: 75 }).target);
  });
});
