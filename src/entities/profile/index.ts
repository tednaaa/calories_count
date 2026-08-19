export type { CalcInput, Measurements, TargetBreakdown } from './lib/calories';
export {
  ACTIVITY_FACTOR,
  calcBmr,
  calcTarget,
  calcTdee,
  GOAL_FACTOR,
  isWithinLimits,
  LIMITS,
  SAFE_MINIMUM_KCAL,
} from './lib/calories';
export type { ProfileDraft } from './lib/draft';
export { draftFromProfile, draftsEqual, draftToInput, emptyDraft } from './lib/draft';
export { activityOptions, goalOptions, sexOptions } from './lib/options';
export type { ProfileInput } from './lib/profile';
export {
  loadProfile,
  nextProfile,
  resetTargetToCalculated,
  saveProfile,
  setManualTarget,
  withCalculatedTarget,
  withManualTarget,
} from './lib/profile';
export { default as ProfileFields } from './ui/ProfileFields.vue';
