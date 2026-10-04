export type { BmiCategory } from './lib/bmi';
export { ADULT_AGE, bmiCategory, calcBmi, describeBmi, healthyWeightRange } from './lib/bmi';
export type { CalcInput, Calibration, Measurements, TargetBreakdown } from './lib/calories';
export {
  ACTIVITY_FACTOR,
  calcBmr,
  calcTarget,
  calcTdee,
  calibrateTarget,
  CALIBRATION_STEP_KCAL,
  currentAge,
  GOAL_FACTOR,
  isWithinLimits,
  LIMITS,
  SAFE_MINIMUM_KCAL,
} from './lib/calories';
export type { ProfileDraft } from './lib/draft';
export { draftFromProfile, draftsEqual, draftToInput, emptyDraft, hasInvalidTargetWeight, parseTargetWeight } from './lib/draft';
export { activityOptions, goalOptions, sexOptions } from './lib/options';
export type { ProfileInput } from './lib/profile';
export {
  applyCalibration,
  loadProfile,
  nextProfile,
  recordWeight,
  resetCalibration,
  resetTargetToCalculated,
  saveProfile,
  setManualTarget,
  withCalculatedTarget,
  withCalibration,
  withManualTarget,
  withoutCalibration,
  withWeight,
} from './lib/profile';
export type { WeightToGo } from './lib/weight-goal';
export { isGainingGoal, targetConflict, weightToGo } from './lib/weight-goal';
export { default as ProfileFields } from './ui/ProfileFields.vue';
