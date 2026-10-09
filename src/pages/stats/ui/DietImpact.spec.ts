import type { Impact } from '../lib/impact';
import { mount } from '@vue/test-utils';
import DietImpact from './DietImpact.vue';

const impact: Impact = {
	weighIns: 9,
	trackedDays: 27,
	countedDays: 27,
	coverage: 1,
	averageIntake: 2400,
	expectedPerWeek: -0.4,
	actualPerWeek: -0.2,
	realTdee: 2617,
	realTdeeError: 238,
	projection: { weighIns: 13, error: 192 },
};

function mountReady(overrides: Partial<Impact> = {}, reminds = true) {
	return mount(DietImpact, { props: { result: { ready: true, impact: { ...impact, ...overrides } }, estimatedTdee: 2836, reminds } });
}

describe('diet impact summary', () => {
	it('compares expected and actual weekly rate', () => {
		const text = mountReady().text();

		expect(text).toContain('−0,40 кг/нед');
		expect(text).toContain('−0,20 кг/нед');
	});

	it('shows real energy burn with its error next to the formula estimate', () => {
		const text = mountReady().text();

		expect(text).toContain('≈ 2 620');
		expect(text).toContain('± 240 ккал');
		expect(text).toContain('2 840 ккал');
	});

	it('explains what the accuracy rests on and what more weigh-ins would give', () => {
		expect(mountReady().text()).toContain('По 9 взвешиваниям; при 13 будет ± 190 ккал. Еда записана за 27 из 27 дней.');
	});

	it('warns about gaps in the food log', () => {
		expect(mountReady().text()).not.toContain('меньше чем за 70 %');
		expect(mountReady({ coverage: 0.5 }).text()).toContain('меньше чем за 70 %');
	});

	it('promises a reminder only when it is enabled', () => {
		expect(mountReady().text()).toContain('Приложение напомнит');
		expect(mountReady({}, false).text()).not.toContain('Приложение напомнит');
	});

	it('lists what is missing when data is insufficient', () => {
		const text = mount(DietImpact, {
			props: { result: { ready: false, shortfall: { weighIns: 2, spanDays: 0, trackedDays: 5 } }, estimatedTdee: 2836, reminds: true },
		}).text();

		expect(text).toContain('2 взвешивания');
		expect(text).toContain('5 дней с записями еды');
		expect(text).not.toContain('между первым и последним');
	});
});
