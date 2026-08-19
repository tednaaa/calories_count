import type { CalcInput } from './calories';
import type { ActivityLevel, Goal, Profile, Sex } from '@/shared/db';
import { isWithinLimits } from './calories';

export interface ProfileDraft {
  sex: Sex;
  age: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel;
  goal: Goal;
}

export function emptyDraft(): ProfileDraft {
  return {
    sex: 'male',
    age: '',
    heightCm: '',
    weightKg: '',
    activity: 'moderate',
    goal: 'cutMild',
  };
}

export function draftFromProfile(profile: Profile): ProfileDraft {
  return {
    sex: profile.sex,
    age: String(profile.age),
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    activity: profile.activity,
    goal: profile.goal,
  };
}

export function draftsEqual(a: ProfileDraft, b: ProfileDraft): boolean {
  return a.sex === b.sex
    && a.age === b.age
    && a.heightCm === b.heightCm
    && a.weightKg === b.weightKg
    && a.activity === b.activity
    && a.goal === b.goal;
}

export function draftToInput(draft: ProfileDraft): CalcInput | null {
  const candidate: CalcInput = {
    sex: draft.sex,
    age: Number(draft.age),
    heightCm: Number(draft.heightCm),
    weightKg: Number(draft.weightKg),
    activity: draft.activity,
    goal: draft.goal,
  };

  const filled = [candidate.age, candidate.heightCm, candidate.weightKg].every(Number.isFinite);

  return filled && isWithinLimits(candidate) ? candidate : null;
}
