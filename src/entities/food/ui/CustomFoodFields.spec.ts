import type { CustomDraft } from '../lib/custom-draft';
import { mount } from '@vue/test-utils';
import { emptyCustomDraft } from '../lib/custom-draft';
import CustomFoodFields from './CustomFoodFields.vue';

function mountFields(overrides: Partial<CustomDraft> = {}) {
	return mount(CustomFoodFields, { props: { modelValue: { ...emptyCustomDraft(), ...overrides } } });
}

const BASE = '[aria-label="Базовый вес"]';
const VOLUME_BASE = '[aria-label="Базовый объём"]';

describe('custom food form', () => {
	it('offers grams or milliliters for a weighed basis', () => {
		const tabs = mountFields({ serving: 'hundred' }).findAll('[data-slot="tabs-trigger"]');

		expect(tabs.map(tab => tab.text())).toEqual(['г', 'мл', 'Порция', '100 г', 'Своё']);
	});

	it('relabels fields for milliliters', () => {
		const wrapper = mountFields({ serving: 'custom', unit: 'ml' });

		expect(wrapper.text()).toContain('Объём порции');
		expect(wrapper.find(VOLUME_BASE).exists()).toBe(true);
		expect(wrapper.find(BASE).exists()).toBe(false);
	});

	it('writes the selected unit to the draft', async () => {
		const draft = { ...emptyCustomDraft(), serving: 'hundred' as const };
		const wrapper = mount(CustomFoodFields, { props: { modelValue: draft } });

		await wrapper.findAll('[data-slot="tabs-trigger"]')[1].trigger('mousedown');

		expect(draft.unit).toBe('ml');
	});

	it('hides the basis field for portion and per-100', () => {
		expect(mountFields({ serving: 'portion' }).find(BASE).exists()).toBe(false);
		expect(mountFields({ serving: 'hundred' }).find(BASE).exists()).toBe(false);
	});

	it('asks for basis weight on a custom basis', () => {
		expect(mountFields({ serving: 'custom' }).find(BASE).exists()).toBe(true);
	});

	it('does not ask for portion weight without a weighed basis', () => {
		expect(mountFields({ serving: 'portion' }).find('#custom-portion').exists()).toBe(false);
	});

	it('asks for portion weight with a weighed basis', () => {
		expect(mountFields({ serving: 'hundred' }).find('#custom-portion').exists()).toBe(true);
	});

	it('shows the portion summary from label and portion weight', () => {
		const wrapper = mountFields({ serving: 'hundred', kcal: '270', portion: '130' });

		expect(wrapper.text()).toContain('Одна порция — 130 г · 351 ккал');
	});

	it('writes the selected tab to the draft', async () => {
		const draft = { ...emptyCustomDraft() };
		const wrapper = mount(CustomFoodFields, { props: { modelValue: draft } });

		await wrapper.findAll('[data-slot="tabs-trigger"]')[1].trigger('mousedown');

		expect(draft.serving).toBe('hundred');
	});
});
