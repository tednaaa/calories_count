import type { Impact } from './impact';
import type { Profile } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { calibrateTarget, SAFE_MINIMUM_KCAL } from '@/entities/profile';
import { daysBetween, toDateKey } from '@/shared/lib';
import { SOLID_COVERAGE } from './impact';

export const MIN_PROFILE_AGE_DAYS = 14;
export const MIN_CALIBRATION_WEIGH_INS = 8;
export const PRECISE_ENOUGH_KCAL = 50;
export const CALIBRATION_INTERVAL_DAYS = 28;

export type CalibrationOffer
	= | { kind: 'early'; daysLeft: number }
		| { kind: 'recent'; daysLeft: number }
		| { kind: 'fewWeighIns'; missing: number }
		| { kind: 'patchyFood' }
		| { kind: 'precise' }
		| { kind: 'atMinimum' }
		| { kind: 'offer'; ideal: number; next: number; tdeeCorrectionKcal: number };

function daysSince(epochMs: number, today: DateKey): number {
	return daysBetween(toDateKey(new Date(epochMs)), today);
}

export function offerCalibration(impact: Impact, profile: Profile, today: DateKey): CalibrationOffer {
	const profileAge = daysSince(profile.createdAt, today);
	const sinceCalibration = profile.calibratedAt ? daysSince(profile.calibratedAt, today) : Infinity;

	if (profileAge < MIN_PROFILE_AGE_DAYS) {
		return { kind: 'early', daysLeft: MIN_PROFILE_AGE_DAYS - profileAge };
	}
	if (sinceCalibration < CALIBRATION_INTERVAL_DAYS) {
		return { kind: 'recent', daysLeft: CALIBRATION_INTERVAL_DAYS - sinceCalibration };
	}
	if (impact.weighIns < MIN_CALIBRATION_WEIGH_INS) {
		return { kind: 'fewWeighIns', missing: MIN_CALIBRATION_WEIGH_INS - impact.weighIns };
	}
	if (impact.coverage < SOLID_COVERAGE) {
		return { kind: 'patchyFood' };
	}

	const { ideal, next, tdeeCorrectionKcal } = calibrateTarget(profile, impact.realTdee);

	if (next === profile.targetKcal && next === SAFE_MINIMUM_KCAL[profile.sex]) {
		return { kind: 'atMinimum' };
	}
	if (Math.abs(ideal - profile.targetKcal) < PRECISE_ENOUGH_KCAL) {
		return { kind: 'precise' };
	}

	return { kind: 'offer', ideal, next, tdeeCorrectionKcal };
}
