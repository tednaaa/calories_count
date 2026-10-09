import { ageToBirthDate, renameGrams } from './legacy';

describe('renameGrams', () => {
	it('moves the legacy portion weight to the new field', () => {
		expect(renameGrams({ id: 'cheese', grams: 130 })).toEqual({ id: 'cheese', amount: 130 });
	});

	it('moves the weight inside the label basis too', () => {
		expect(renameGrams({ grams: 130, basis: { grams: 100, kcal: 270 } })).toEqual({
			amount: 130,
			basis: { amount: 100, kcal: 270 },
		});
	});

	it('leaves already migrated records untouched', () => {
		expect(renameGrams({ amount: 130, basis: { amount: 100, kcal: 270 } })).toEqual({
			amount: 130,
			basis: { amount: 100, kcal: 270 },
		});
	});

	it('adds no weight to records without one', () => {
		expect(renameGrams({ id: 'pie', kcal: 350 })).toEqual({ id: 'pie', kcal: 350 });
	});
});

describe('ageToBirthDate', () => {
	it('replaces age with January 1 of the birth year so the current age stays the same', () => {
		expect(ageToBirthDate({ id: 'me', age: 30 }, '2026-10-04')).toEqual({ id: 'me', birthDate: '1996-01-01' });
	});

	it('leaves a profile with a birth date untouched', () => {
		expect(ageToBirthDate({ id: 'me', birthDate: '1990-05-01' }, '2026-10-04')).toEqual({ id: 'me', birthDate: '1990-05-01' });
	});
});
