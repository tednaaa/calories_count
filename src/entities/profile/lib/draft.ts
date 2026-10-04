import type { ProfileInput } from './profile';
import type { ActivityLevel, Goal, Profile, Sex } from '@/shared/db';
import { formatKg, isDateKey, parseKg } from '@/shared/lib';
import { isWithinLimits } from './calories';

export interface ProfileDraft {
  sex: Sex;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  activity: ActivityLevel;
  goal: Goal;
}

export function emptyDraft(): ProfileDraft {
  return {
    sex: 'male',
    birthDate: '',
    heightCm: '',
    weightKg: '',
    targetWeightKg: '',
    activity: 'moderate',
    goal: 'cutMild',
  };
}

export function draftFromProfile(profile: Profile): ProfileDraft {
  return {
    sex: profile.sex,
    birthDate: profile.birthDate,
    heightCm: String(profile.heightCm),
    weightKg: formatKg(profile.weightKg),
    targetWeightKg: profile.targetWeightKg ? formatKg(profile.targetWeightKg) : '',
    activity: profile.activity,
    goal: profile.goal,
  };
}

export function draftsEqual(a: ProfileDraft, b: ProfileDraft): boolean {
  return a.sex === b.sex
    && a.birthDate === b.birthDate
    && a.heightCm === b.heightCm
    && a.weightKg === b.weightKg
    && a.targetWeightKg.trim() === b.targetWeightKg.trim()
    && a.activity === b.activity
    && a.goal === b.goal;
}

export function parseTargetWeight(raw: string): number | undefined | null {
  return raw.trim() === '' ? undefined : parseKg(raw);
}

export function hasInvalidTargetWeight(draft: ProfileDraft): boolean {
  return parseTargetWeight(draft.targetWeightKg) === null;
}

export function draftToInput(draft: ProfileDraft): ProfileInput | null {
  const targetWeightKg = parseTargetWeight(draft.targetWeightKg);
  const candidate: ProfileInput = {
    sex: draft.sex,
    birthDate: draft.birthDate,
    heightCm: Number(draft.heightCm),
    weightKg: parseKg(draft.weightKg) ?? Number.NaN,
    activity: draft.activity,
    goal: draft.goal,
    ...(targetWeightKg && { targetWeightKg }),
  };

  const filled = isDateKey(candidate.birthDate) && [candidate.heightCm, candidate.weightKg].every(Number.isFinite);

  return filled && isWithinLimits(candidate) ? candidate : null;
}
