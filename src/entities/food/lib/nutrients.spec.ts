import { formatNutrient, portionNutrients, scaleNutrients, sumNutrients } from './nutrients';

const label = { protein: 0, fat: 0, carbs: 12, sugars: 12, fiber: 0, salt: 0 };

describe('scaleNutrients', () => {
	it('scales all nutrients at once', () => {
		expect(scaleNutrients({ protein: 10, carbs: 20 }, 2)).toEqual({ protein: 20, carbs: 40 });
	});

	it('rounds to one decimal place', () => {
		expect(scaleNutrients({ salt: 1.07 }, 1.3)).toEqual({ salt: 1.4 });
	});

	it('returns undefined without a label', () => {
		expect(scaleNutrients(undefined, 2)).toBeUndefined();
	});
});

describe('portionNutrients', () => {
	it('scales the label to the portion', () => {
		expect(portionNutrients({ amount: 100, kcal: 50, nutrients: label }, 450))
			.toEqual({ protein: 0, fat: 0, carbs: 54, sugars: 54, fiber: 0, salt: 0 });
	});

	it('returns undefined for food without nutrients', () => {
		expect(portionNutrients({ amount: 100, kcal: 270 }, 130)).toBeUndefined();
	});
});

describe('sumNutrients', () => {
	it('sums the entries of a day', () => {
		expect(sumNutrients([{ protein: 10, sugars: 2 }, { protein: 5, sugars: 3 }]))
			.toEqual({ protein: 15, sugars: 5 });
	});

	it('skips entries without data', () => {
		expect(sumNutrients([{ protein: 10 }, undefined])).toEqual({ protein: 10 });
	});

	it('sums only nutrients someone specified', () => {
		expect(sumNutrients([{ protein: 10 }, { sugars: 4 }])).toEqual({ protein: 10, sugars: 4 });
	});

	it('returns undefined for an empty day', () => {
		expect(sumNutrients([undefined, undefined])).toBeUndefined();
	});
});

describe('formatNutrient', () => {
	it('writes integers without decimals', () => {
		expect(formatNutrient(54)).toBe('54 г');
	});

	it('writes fractions with a comma', () => {
		expect(formatNutrient(1.25)).toBe('1,3 г');
	});
});
