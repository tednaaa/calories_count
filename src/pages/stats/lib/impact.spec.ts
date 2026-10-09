import type { ImpactInput, WeightPoint } from './impact';
import type { WeightRecord } from '@/shared/db';
import { lastDateKeys } from '@/shared/lib';
import { analyzeImpact, evenSpreadError, fitTrend, formatKcal, formatRate, IMPACT_WINDOW_DAYS, toPoints } from './impact';

const days = lastDateKeys(IMPACT_WINDOW_DAYS, '2026-10-28');

function weighIns(dayIndexes: number[], kgAt: (day: number) => number): WeightRecord[] {
	return dayIndexes.map(day => ({ date: days[day], kg: kgAt(day), createdAt: 0 }));
}

function eaten(kcal: number, dayIndexes: number[] = days.map((_, index) => index)): Map<string, number> {
	return new Map(dayIndexes.map(day => [days[day], kcal]));
}

function input(overrides: Partial<ImpactInput> = {}): ImpactInput {
	return {
		days,
		totals: eaten(2400),
		weights: weighIns([0, 3, 7, 10, 14, 17, 21, 24, 27], day => 86 - day * 0.2 / 7),
		estimatedTdee: 2840,
		...overrides,
	};
}

function ready(overrides: Partial<ImpactInput> = {}) {
	const result = analyzeImpact(input(overrides));

	if (!result.ready) {
		throw new Error('expected ready output');
	}

	return result.impact;
}

describe('fitTrend', () => {
	it('finds the slope of a straight series', () => {
		const points: WeightPoint[] = [{ day: 0, kg: 86 }, { day: 7, kg: 85.8 }, { day: 14, kg: 85.6 }];

		expect(fitTrend(points)?.slope).toBeCloseTo(-0.2 / 7);
	});

	it('builds no trend from one point or one day', () => {
		expect(fitTrend([{ day: 3, kg: 85 }])).toBeNull();
		expect(fitTrend([{ day: 3, kg: 85 }, { day: 3, kg: 86 }])).toBeNull();
	});

	it('uses typical weight noise with few weigh-ins', () => {
		expect(fitTrend([{ day: 0, kg: 86 }, { day: 14, kg: 85.6 }])?.noise).toBe(0.7);
	});

	it('keeps noise at least half a kilogram even on a perfect line', () => {
		const points = [0, 4, 8, 12, 16, 20].map(day => ({ day, kg: 86 - day * 0.03 }));

		expect(fitTrend(points)?.noise).toBe(0.5);
	});

	it('measures noise from residuals when there are enough weigh-ins', () => {
		const points = [0, 4, 8, 12, 16, 20].map((day, index) => ({ day, kg: 86 + (index % 2 ? 1.2 : -1.2) }));

		expect(fitTrend(points)?.noise).toBeGreaterThan(1);
	});
});

describe('slope error', () => {
	it('decreases with more weigh-ins', () => {
		expect(evenSpreadError(0.7, 12, 28)).toBeLessThan(evenSpreadError(0.7, 8, 28));
		expect(evenSpreadError(0.7, 28, 28)).toBeLessThan(evenSpreadError(0.7, 12, 28));
	});

	it('gives about ±200 kcal at 2–3 weigh-ins per week', () => {
		expect(evenSpreadError(0.7, 12, 28) * 7700).toBeCloseTo(190, -1);
	});

	it('bunched weigh-ins at window start are no more precise', () => {
		const bunched = [0, 1, 2, 3, 4, 5, 6, 27].map(day => ({ day, kg: 86 }));
		const spread = [0, 4, 8, 12, 16, 20, 24, 27].map(day => ({ day, kg: 86 }));

		expect(fitTrend(bunched)!.slopeError).toBeGreaterThan(fitTrend(spread)!.slopeError);
	});
});

describe('toPoints', () => {
	it('counts days from window start and drops weigh-ins outside it', () => {
		const records: WeightRecord[] = [
			{ date: '2026-09-20', kg: 90, createdAt: 0 },
			{ date: days[0], kg: 86, createdAt: 0 },
			{ date: days[5], kg: 85.8, createdAt: 0 },
		];

		expect(toPoints(records, days)).toEqual([{ day: 0, kg: 86 }, { day: 5, kg: 85.8 }]);
	});
});

describe('analyzeImpact', () => {
	it('compares food-based expected rate with actual', () => {
		const impact = ready();

		expect(impact.expectedPerWeek).toBeCloseTo(-0.4, 2);
		expect(impact.actualPerWeek).toBeCloseTo(-0.2, 2);
	});

	it('derives real TDEE from intake and weight slope', () => {
		expect(ready().realTdee).toBeCloseTo(2620, 0);
	});

	it('skips unfinished today', () => {
		const impact = ready({ totals: new Map([...eaten(2400), [days[27], 300]]) });

		expect(impact.averageIntake).toBe(2400);
		expect(impact.countedDays).toBe(27);
	});

	it('does not count untracked days as fasting', () => {
		const impact = ready({ totals: eaten(2400, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]) });

		expect(impact.averageIntake).toBe(2400);
		expect(impact.trackedDays).toBe(14);
	});

	it('reports coverage below 70 % when food is not tracked every day', () => {
		const impact = ready({ totals: eaten(2400, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]) });

		expect(impact.coverage).toBeCloseTo(14 / 27);
	});

	it('projects better precision with four more weigh-ins', () => {
		const impact = ready();

		expect(impact.projection?.weighIns).toBe(13);
		expect(impact.projection!.error).toBeLessThan(impact.realTdeeError);
	});

	it('gives no result with two weigh-ins', () => {
		const result = analyzeImpact(input({ weights: weighIns([0, 20], () => 86) }));

		expect(result).toEqual({ ready: false, shortfall: { weighIns: 1, spanDays: 0, trackedDays: 0 } });
	});

	it('gives no result when weigh-ins span a week', () => {
		const result = analyzeImpact(input({ weights: weighIns([20, 23, 27], () => 86) }));

		expect(result).toEqual({ ready: false, shortfall: { weighIns: 0, spanDays: 7, trackedDays: 0 } });
	});

	it('gives no result with few tracked food days', () => {
		const result = analyzeImpact(input({ totals: eaten(2400, [0, 1, 2, 3, 4]) }));

		expect(result).toEqual({ ready: false, shortfall: { weighIns: 0, spanDays: 0, trackedDays: 9 } });
	});

	it('lists everything missing on empty data', () => {
		const result = analyzeImpact(input({ weights: [], totals: new Map() }));

		expect(result).toEqual({ ready: false, shortfall: { weighIns: 3, spanDays: 14, trackedDays: 14 } });
	});
});

describe('formatting', () => {
	it('writes rate with sign and decimal comma', () => {
		expect(formatRate(-0.2)).toBe('−0,20 кг/нед');
		expect(formatRate(0.35)).toBe('+0,35 кг/нед');
		expect(formatRate(0.001)).toBe('0,00 кг/нед');
	});

	it('rounds calories to tens', () => {
		expect(formatKcal(2617.4)).toBe('2 620');
	});
});
