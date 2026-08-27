import type { CustomDraft } from '../lib/custom-draft';
import { mount } from '@vue/test-utils';
import { emptyCustomDraft } from '../lib/custom-draft';
import CustomFoodFields from './CustomFoodFields.vue';

function mountFields(overrides: Partial<CustomDraft> = {}) {
  return mount(CustomFoodFields, { props: { modelValue: { ...emptyCustomDraft(), ...overrides } } });
}

const BASE = '[aria-label="Базовый вес"]';

describe('форма своего блюда', () => {
  it('предлагает порцию, сотню и свою базу', () => {
    const tabs = mountFields().findAll('[data-slot="tabs-trigger"]');

    expect(tabs.map(tab => tab.text())).toEqual(['Порция', '100 г', 'Своё']);
  });

  it('на порции и сотне поле базы не мешается', () => {
    expect(mountFields({ serving: 'portion' }).find(BASE).exists()).toBe(false);
    expect(mountFields({ serving: 'hundred' }).find(BASE).exists()).toBe(false);
  });

  it('на своей базе спрашивает базовый вес', () => {
    expect(mountFields({ serving: 'custom' }).find(BASE).exists()).toBe(true);
  });

  it('без граммовки вес порции не спрашивает', () => {
    expect(mountFields({ serving: 'portion' }).find('#custom-portion').exists()).toBe(false);
  });

  it('с граммовкой спрашивает вес порции', () => {
    expect(mountFields({ serving: 'hundred' }).find('#custom-portion').exists()).toBe(true);
  });

  it('показывает, во что складываются этикетка и вес порции', () => {
    const wrapper = mountFields({ serving: 'hundred', kcal: '270', portion: '130' });

    expect(wrapper.text()).toContain('Одна порция — 130 г · 351 ккал');
  });

  it('выбранный таб уходит в черновик', async () => {
    const draft = { ...emptyCustomDraft() };
    const wrapper = mount(CustomFoodFields, { props: { modelValue: draft } });

    await wrapper.findAll('[data-slot="tabs-trigger"]')[1].trigger('mousedown');

    expect(draft.serving).toBe('hundred');
  });

  it('калорийность уходит в черновик', async () => {
    const draft = { ...emptyCustomDraft() };
    const wrapper = mount(CustomFoodFields, { props: { modelValue: draft } });

    await wrapper.find('#custom-kcal').setValue('270');

    expect(draft.kcal).toBe('270');
  });

  it('вес порции уходит в черновик', async () => {
    const draft = { ...emptyCustomDraft(), serving: 'hundred' as const };
    const wrapper = mount(CustomFoodFields, { props: { modelValue: draft } });

    await wrapper.find('#custom-portion').setValue('130');

    expect(draft.portion).toBe('130');
  });
});
