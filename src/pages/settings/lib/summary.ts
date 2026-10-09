import type { Profile } from '@/shared/db';
import { currentAge, goalOptions } from '@/entities/profile';
import { formatKg, pluralize } from '@/shared/lib';

export function targetOrigin(profile: Profile): string {
	if (profile.targetOverridden) {
		return 'Задана вручную';
	}

	return profile.calibratedAt ? 'Уточнена по весу' : 'Посчитана по профилю';
}

export function describeProfile(profile: Profile): string {
	const goal = goalOptions.find(option => option.id === profile.goal)?.name;
	const years = currentAge(profile.birthDate);
	const age = `${years} ${pluralize(years, ['год', 'года', 'лет'])}`;

	return [goal, age, `${profile.heightCm} см`, `${formatKg(profile.weightKg)} кг`]
		.filter(Boolean)
		.join(' · ');
}

export function needsIosInstallHint(userAgent: string, standalone: boolean): boolean {
	return /iPhone|iPad|iPod/.test(userAgent) && !standalone;
}
