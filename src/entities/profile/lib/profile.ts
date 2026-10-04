import type { Profile } from '@/shared/db';
import { db, PROFILE_ID } from '@/shared/db';
import { calcTarget } from './calories';
import { logWeight } from './weight-log';

export type ProfileInput = Pick<Profile, 'sex' | 'birthDate' | 'heightCm' | 'weightKg' | 'targetWeightKg' | 'activity' | 'goal'>;

type Calibration = Pick<Profile, 'tdeeCorrectionKcal' | 'calibratedAt'>;

function calibrationOf(profile: Profile | undefined): Calibration {
  return profile?.calibratedAt
    ? { tdeeCorrectionKcal: profile.tdeeCorrectionKcal, calibratedAt: profile.calibratedAt }
    : {};
}

export function nextProfile(current: Profile | undefined, input: ProfileInput, now: number): Profile {
  const keepsManualTarget = current?.targetOverridden === true;
  const calibration = calibrationOf(current);

  return {
    id: PROFILE_ID,
    ...input,
    ...calibration,
    targetKcal: keepsManualTarget ? current.targetKcal : calcTarget({ ...input, ...calibration }).target,
    targetOverridden: keepsManualTarget,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

export function withManualTarget(profile: Profile, targetKcal: number, now: number): Profile {
  return { ...profile, targetKcal, targetOverridden: true, updatedAt: now };
}

export function withCalculatedTarget(profile: Profile, now: number): Profile {
  return {
    ...profile,
    targetKcal: calcTarget(profile).target,
    targetOverridden: false,
    updatedAt: now,
  };
}

export function withCalibration(profile: Profile, tdeeCorrectionKcal: number, now: number): Profile {
  const calibrated = { ...profile, tdeeCorrectionKcal, calibratedAt: now };

  return { ...calibrated, targetKcal: calcTarget(calibrated).target, targetOverridden: false, updatedAt: now };
}

export function withoutCalibration(profile: Profile, now: number): Profile {
  const { tdeeCorrectionKcal: _correction, calibratedAt: _calibratedAt, ...rest } = profile;
  const targetKcal = rest.targetOverridden ? rest.targetKcal : calcTarget(rest).target;

  return { ...rest, targetKcal, updatedAt: now };
}

export function loadProfile(): Promise<Profile | undefined> {
  return db.profile.get(PROFILE_ID);
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const now = Date.now();
  const current = await loadProfile();
  const profile = nextProfile(current, input, now);

  await db.profile.put(profile);

  if (current?.weightKg !== profile.weightKg) {
    await logWeight(profile.weightKg, now);
  }

  return profile;
}

export async function setManualTarget(targetKcal: number): Promise<void> {
  const current = await loadProfile();

  if (current) {
    await db.profile.put(withManualTarget(current, targetKcal, Date.now()));
  }
}

export async function applyCalibration(tdeeCorrectionKcal: number): Promise<void> {
  const current = await loadProfile();

  if (current) {
    await db.profile.put(withCalibration(current, tdeeCorrectionKcal, Date.now()));
  }
}

export async function resetCalibration(): Promise<void> {
  const current = await loadProfile();

  if (current) {
    await db.profile.put(withoutCalibration(current, Date.now()));
  }
}

export async function resetTargetToCalculated(): Promise<void> {
  const current = await loadProfile();

  if (current) {
    await db.profile.put(withCalculatedTarget(current, Date.now()));
  }
}

export function withWeight(profile: Profile, weightKg: number): ProfileInput {
  const { sex, birthDate, heightCm, targetWeightKg, activity, goal } = profile;

  return { sex, birthDate, heightCm, weightKg, activity, goal, ...(targetWeightKg && { targetWeightKg }) };
}

export async function recordWeight(kg: number): Promise<void> {
  const now = Date.now();

  await db.transaction('rw', db.profile, db.weightLog, async () => {
    const current = await loadProfile();

    if (current) {
      await db.profile.put(nextProfile(current, withWeight(current, kg), now));
    }

    await logWeight(kg, now);
  });
}
