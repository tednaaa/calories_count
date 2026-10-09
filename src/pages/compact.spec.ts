import { nextCompact } from './compact';

const longList = { scrollTop: 1, scrollable: 900, headerHeight: 280 };
const shortList = { scrollTop: 1, scrollable: 40, headerHeight: 280 };

describe('nextCompact', () => {
	it('collapses on any scroll', () => {
		expect(nextCompact(false, longList)).toBe(true);
	});

	it('expands only at the very top', () => {
		expect(nextCompact(true, { ...longList, scrollTop: 1 })).toBe(true);
		expect(nextCompact(true, { ...longList, scrollTop: 0 })).toBe(false);
	});

	it('stays expanded when collapsing would leave nothing to scroll', () => {
		expect(nextCompact(false, shortList)).toBe(false);
	});

	it('keeps collapsed when scroll settles', () => {
		expect(nextCompact(true, shortList)).toBe(true);
	});
});
