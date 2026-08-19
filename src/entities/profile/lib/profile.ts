import type { Profile } from '@/shared/db';
import { db, PROFILE_ID } from '@/shared/db';
import { toDateKey } from '@/shared/lib';
import { calcTarget } from './calories';

export type ProfileInput = Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activity' | 'goal'>;

export function nextProfile(current: Profile | undefined, input: ProfileInput, now: number): Profile {
  const keepsManualTarget = current?.targetOverridden === true;

  return {
    id: PROFILE_ID,
    ...input,
    targetKcal: keepsManualTarget ? current.targetKcal : calcTarget(input).target,
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

export function loadProfile(): Promise<Profile | undefined> {
  return db.profile.get(PROFILE_ID);
}

async function logWeight(kg: number, now: number): Promise<void> {
  const date = toDateKey(new Date(now));
  const existing = await db.weightLog.where('date').equals(date).first();

  await db.weightLog.put({ ...existing, date, kg, createdAt: now });
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

export async function resetTargetToCalculated(): Promise<void> {
  const current = await loadProfile();

  if (current) {
    await db.profile.put(withCalculatedTarget(current, Date.now()));
  }
}
