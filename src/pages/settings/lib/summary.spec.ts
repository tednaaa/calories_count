import type { Profile } from '@/shared/db';
import { toDateKey, yearsBefore } from '@/shared/lib';
import { describeProfile, needsIosInstallHint, targetOrigin } from './summary';

function profile(overrides: Partial<Profile> = {}): Profile {
	return {
		id: 'me',
		sex: 'male',
		birthDate: yearsBefore(toDateKey(), 31),
		heightCm: 180,
		weightKg: 85.5,
		activity: 'moderate',
		goal: 'cutMild',
		targetKcal: 2410,
		targetOverridden: false,
		createdAt: 0,
		updatedAt: 0,
		...overrides,
	};
}

describe('targetOrigin', () => {
	it('distinguishes calculated, calibrated and manual targets', () => {
		expect(targetOrigin(profile())).toBe('Посчитана по профилю');
		expect(targetOrigin(profile({ calibratedAt: 1 }))).toBe('Уточнена по весу');
		expect(targetOrigin(profile({ calibratedAt: 1, targetOverridden: true }))).toBe('Задана вручную');
	});
});

describe('describeProfile', () => {
	it('summarizes the profile in one line', () => {
		expect(describeProfile(profile())).toBe('Мягкое похудение · 31 год · 180 см · 85,5 кг');
	});
});

describe('needsIosInstallHint', () => {
	const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';

	it('hints only on iPhone outside the installed app', () => {
		expect(needsIosInstallHint(iphone, false)).toBe(true);
		expect(needsIosInstallHint(iphone, true)).toBe(false);
		expect(needsIosInstallHint('Mozilla/5.0 (Linux; Android 15)', false)).toBe(false);
	});
});
