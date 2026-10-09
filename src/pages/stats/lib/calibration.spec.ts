import type { Impact } from './impact';
import type { Profile } from '@/shared/db';
import { toDateKey, yearsBefore } from '@/shared/lib';
import { offerCalibration } from './calibration';

const TODAY = '2026-10-28';

const impact: Impact = {
	weighIns: 9,
	trackedDays: 27,
	countedDays: 27,
	coverage: 1,
	averageIntake: 2400,
	expectedPerWeek: -0.4,
	actualPerWeek: -0.2,
	realTdee: 2620,
	realTdeeError: 238,
	projection: null,
};

function profile(overrides: Partial<Profile> = {}): Profile {
	return {
		id: 'me',
		sex: 'male',
		birthDate: yearsBefore(toDateKey(), 30),
		heightCm: 180,
		weightKg: 85,
		activity: 'moderate',
		goal: 'cutMild',
		targetKcal: 2410,
		targetOverridden: false,
		createdAt: new Date(2026, 8, 1).getTime(),
		updatedAt: 0,
		...overrides,
	};
}

describe('offerCalibration', () => {
	it('offers a goal target from real expenditure', () => {
		expect(offerCalibration(impact, profile(), TODAY)).toMatchObject({ kind: 'offer', ideal: 2230, next: 2230 });
	});

	it('waits a month after calibration before the next step', () => {
		const calibrated = profile({ calibratedAt: new Date(2026, 9, 20).getTime() });

		expect(offerCalibration({ ...impact, realTdee: 2200 }, calibrated, TODAY)).toEqual({ kind: 'recent', daysLeft: 20 });
	});

	it('offers a target again a month after calibration', () => {
		const calibrated = profile({ calibratedAt: new Date(2026, 8, 30).getTime() });

		expect(offerCalibration(impact, calibrated, TODAY)).toMatchObject({ kind: 'offer' });
	});

	it('stays silent for the first 14 days while water weight drops', () => {
		expect(offerCalibration(impact, profile({ createdAt: new Date(2026, 9, 20).getTime() }), TODAY))
			.toEqual({ kind: 'early', daysLeft: 6 });
	});

	it('asks for weigh-ins while there are fewer than eight', () => {
		expect(offerCalibration({ ...impact, weighIns: 5 }, profile(), TODAY)).toEqual({ kind: 'fewWeighIns', missing: 3 });
	});

	it('does not calibrate on patchy food logs', () => {
		expect(offerCalibration({ ...impact, coverage: 0.6 }, profile(), TODAY)).toEqual({ kind: 'patchyFood' });
	});

	it('reports the target as precise when off by less than 50 kcal', () => {
		expect(offerCalibration({ ...impact, realTdee: 2860 }, profile(), TODAY)).toEqual({ kind: 'precise' });
	});

	it('does not offer going below the safe minimum', () => {
		const atFloor = profile({ sex: 'female', goal: 'cut', targetKcal: 1200 });

		expect(offerCalibration({ ...impact, realTdee: 1300 }, atFloor, TODAY)).toEqual({ kind: 'atMinimum' });
	});
});
