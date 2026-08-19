import type { ProfileInput } from './profile';
import type { Profile } from '@/shared/db';
import { calcTarget } from './calories';
import { nextProfile, withCalculatedTarget, withManualTarget } from './profile';

const input: ProfileInput = {
  sex: 'male',
  age: 30,
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
