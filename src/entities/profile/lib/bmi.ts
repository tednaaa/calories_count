import type { Measurements } from './calories';
import type { BmiCutoffs } from './who-teen-bmi';
import { fullMonthsBetween, toDateKey } from '@/shared/lib';
import { currentAge } from './calories';
import { WHO_TABLE_FIRST_MONTH, WHO_TEEN_BMI_BY_MONTH } from './who-teen-bmi';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export const ADULT_AGE = 18;

const ADULT_CUTOFFS: BmiCutoffs = [18.5, 25, 30];

const SHOWN_BMI_STEP = 0.1;

const CATEGORY_NAMES: Record<BmiCategory, string> = {
	underweight: 'недостаточный вес',
	normal: 'норма',
	overweight: 'избыточный вес',
	obese: 'ожирение',
};

function squaredHeight(heightCm: number): number {
	return (heightCm / 100) ** 2;
}

export function calcBmi(weightKg: number, heightCm: number): number {
	return weightKg / squaredHeight(heightCm);
}

function bmiCutoffs({ sex, birthDate }: Pick<Measurements, 'sex' | 'birthDate'>): BmiCutoffs {
	const months = fullMonthsBetween(birthDate, toDateKey());

	if (months >= ADULT_AGE * 12) {
		return ADULT_CUTOFFS;
	}

	return WHO_TEEN_BMI_BY_MONTH[sex][Math.max(0, months - WHO_TABLE_FIRST_MONTH)];
}

export function bmiCategory(bmi: number, [normalFrom, overweightFrom, obeseFrom] = ADULT_CUTOFFS): BmiCategory {
	if (bmi < normalFrom) {
		return 'underweight';
	}
	if (bmi < overweightFrom) {
		return 'normal';
	}
	if (bmi < obeseFrom) {
		return 'overweight';
	}

	return 'obese';
}

export function healthyWeightRange(heightCm: number, [normalFrom, overweightFrom] = ADULT_CUTOFFS): { min: number; max: number } {
	return {
		min: Math.round(normalFrom * squaredHeight(heightCm)),
		max: Math.round((overweightFrom - SHOWN_BMI_STEP) * squaredHeight(heightCm)),
	};
}

export function describeBmi(measurements: Measurements): string {
	const { birthDate, heightCm, weightKg } = measurements;
	const bmi = calcBmi(weightKg, heightCm);
	const shown = (Math.round(bmi * 10) / 10).toFixed(1).replace('.', ',');
	const cutoffs = bmiCutoffs(measurements);
	const { min, max } = healthyWeightRange(heightCm, cutoffs);
	const age = currentAge(birthDate);
	const normFor = age < ADULT_AGE ? `${heightCm} см в ${age} лет` : `${heightCm} см`;

	return `ИМТ ${shown} — ${CATEGORY_NAMES[bmiCategory(bmi, cutoffs)]}, норма для ${normFor}: ${min}–${max} кг`;
}
