import type { DateKey } from '@/shared/lib';
import { fromDateKey, toDateKey } from '@/shared/lib';

interface LegacyBasis {
	grams?: number;
	amount?: number;
	kcal: number;
}

interface LegacyRow {
	grams?: number;
	amount?: number;
	basis?: LegacyBasis;
}

interface LegacyProfile {
	age?: number;
	birthDate?: string;
}

export function ageToBirthDate<T>(row: T, today: DateKey = toDateKey()): T {
	const legacy = row as LegacyProfile;

	if (typeof legacy.age === 'number' && legacy.birthDate === undefined) {
		legacy.birthDate = toDateKey(new Date(fromDateKey(today).getFullYear() - legacy.age, 0, 1));
		delete legacy.age;
	}

	return row;
}

export function renameGrams<T>(row: T): T {
	const legacy = row as LegacyRow;

	if (legacy.grams !== undefined) {
		legacy.amount = legacy.grams;
		delete legacy.grams;
	}

	if (legacy.basis?.grams !== undefined) {
		legacy.basis.amount = legacy.basis.grams;
		delete legacy.basis.grams;
	}

	return row;
}
