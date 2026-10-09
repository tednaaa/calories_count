import { targetConflict, weightToGo } from './weight-goal';

describe('targetConflict', () => {
	it('flags a cut toward a weight above the current one', () => {
		expect(targetConflict('cut', 85, 90)).toContain('похудение');
		expect(targetConflict('cutMild', 85, 85)).toContain('похудение');
	});

	it('flags a bulk toward a weight below the current one', () => {
		expect(targetConflict('bulk', 70, 65)).toContain('набор');
	});

	it('returns null when goal and target weight agree', () => {
		expect(targetConflict('cut', 85, 78)).toBeNull();
		expect(targetConflict('bulkMild', 70, 75)).toBeNull();
		expect(targetConflict('maintain', 70, 75)).toBeNull();
	});
});

describe('weightToGo', () => {
	it('counts kilograms left when cutting', () => {
		expect(weightToGo('cut', 85.4, 78)).toEqual({ reached: false, kg: 7.4 });
	});

	it('counts kilograms left when bulking', () => {
		expect(weightToGo('bulk', 70, 75.5)).toEqual({ reached: false, kg: 5.5 });
	});

	it('treats an overshot target as reached', () => {
		expect(weightToGo('cutMild', 77.6, 78)).toEqual({ reached: true });
		expect(weightToGo('bulkMild', 76, 75)).toEqual({ reached: true });
	});

	it('allows one kilogram either way when maintaining', () => {
		expect(weightToGo('maintain', 75.8, 75)).toEqual({ reached: true });
		expect(weightToGo('maintain', 77, 75)).toEqual({ reached: false, kg: 2 });
	});
});
