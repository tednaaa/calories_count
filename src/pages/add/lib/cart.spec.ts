import type { Food } from '@/entities/food';
import { cartKcal, cartQty, cartSummary, toCartItem, withCartItem } from './cart';

function food(overrides: Partial<Food> = {}): Food {
	return {
		id: 'egg-boiled',
		name: 'Яйцо варёное',
		kcal: 78,
		photo: 'egg-boiled.webp',
		category: 'basics',
		...overrides,
	};
}

describe('withCartItem', () => {
	it('appends a new item to the end', () => {
		const coffee = toCartItem(food({ id: 'coffee-black', name: 'Кофе', kcal: 5 }), 1);
		const egg = toCartItem(food(), 1);

		expect(withCartItem([coffee], egg).map(item => item.foodId)).toEqual(['coffee-black', 'egg-boiled']);
	});

	it('updates qty of an existing item without moving it', () => {
		const coffee = toCartItem(food({ id: 'coffee-black', name: 'Кофе', kcal: 5 }), 1);
		const egg = toCartItem(food(), 1);
		const result = withCartItem(withCartItem([coffee], egg), toCartItem(food({ id: 'coffee-black' }), 3));

		expect(result.map(item => [item.foodId, item.qty])).toEqual([['coffee-black', 3], ['egg-boiled', 1]]);
	});

	it('keeps the first snapshot when qty changes', () => {
		const original = toCartItem(food(), 1);
		const renamed = toCartItem(food({ name: 'Яйцо', kcal: 999 }), 2);

		expect(withCartItem([original], renamed)[0]).toEqual({ ...original, qty: 2 });
	});

	it('keeps a half portion in the cart', () => {
		const egg = toCartItem(food(), 1);

		expect(withCartItem([egg], { ...egg, qty: 0.5 })[0].qty).toBe(0.5);
	});

	it('removes an item when qty drops to zero', () => {
		const egg = toCartItem(food(), 1);

		expect(withCartItem([egg], { ...egg, qty: 0 })).toEqual([]);
	});

	it('does not add an item with zero qty', () => {
		expect(withCartItem([], toCartItem(food(), 0))).toEqual([]);
	});

	it('does not mutate the original array', () => {
		const items = [toCartItem(food(), 1)];
		withCartItem(items, toCartItem(food({ id: 'apple' }), 1));

		expect(items).toHaveLength(1);
	});
});

describe('cartQty', () => {
	it('returns qty of a selected food', () => {
		expect(cartQty([toCartItem(food(), 3)], 'egg-boiled')).toBe(3);
	});

	it('returns zero for an unselected food', () => {
		expect(cartQty([toCartItem(food(), 3)], 'apple')).toBe(0);
	});
});

describe('cartKcal', () => {
	it('multiplies portion kcal by qty', () => {
		const items = [
			toCartItem(food(), 2),
			toCartItem(food({ id: 'coffee-milk', kcal: 60 }), 1),
		];

		expect(cartKcal(items)).toBe(216);
	});

	it('returns zero for an empty cart', () => {
		expect(cartKcal([])).toBe(0);
	});
});

describe('cartSummary', () => {
	it('pluralizes items by Russian rules', () => {
		const one = [toCartItem(food(), 1)];
		const two = [...one, toCartItem(food({ id: 'apple', kcal: 80 }), 1)];
		const five = [
			...two,
			toCartItem(food({ id: 'banana', kcal: 100 }), 1),
			toCartItem(food({ id: 'curd', kcal: 160 }), 1),
			toCartItem(food({ id: 'shawarma', kcal: 700 }), 1),
		];

		expect(cartSummary(one)).toContain('1 позиция');
		expect(cartSummary(two)).toContain('2 позиции');
		expect(cartSummary(five)).toContain('5 позиций');
	});

	it('shows total kcal', () => {
		expect(cartSummary([toCartItem(food({ kcal: 1200 }), 1)])).toBe('1 позиция · 1 200 ккал');
	});
});
