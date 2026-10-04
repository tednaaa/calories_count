import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import WeekStrip from './WeekStrip.vue';

function mountStrip(selected = '2026-08-19', gestureArea?: HTMLElement) {
  return mount(WeekStrip, { props: { modelValue: selected, gestureArea } });
}

function weekBlocks(wrapper: VueWrapper) {
  return wrapper.findAll('[role="group"] > div');
}

function dayButtons(wrapper: VueWrapper, week?: number) {
  const blocks = weekBlocks(wrapper);

  return blocks[week ?? blocks.length - 1].findAll('button');
}

function labels(wrapper: VueWrapper, week?: number) {
  return dayButtons(wrapper, week).map(button => button.findAll('span')[0].text());
}

function numbers(wrapper: VueWrapper, week?: number) {
  return dayButtons(wrapper, week).map(button => button.findAll('span')[1].text());
}

describe('week strip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 19, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the week from monday to sunday', () => {
    expect(numbers(mountStrip())).toEqual(['17', '18', '19', '20', '21', '22', '23']);
  });

  it('labels today by word and other days by weekday', () => {
    const week = labels(mountStrip());

    expect(week[2]).toBe('Сегодня');
    expect(week[0]).toBe('пн');
  });

  it('emits the tapped day', async () => {
    const wrapper = mountStrip();

    await dayButtons(wrapper)[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-18']]);
  });

  it('disables future days', () => {
    const week = dayButtons(mountStrip());

    expect(week[2].attributes('disabled')).toBeUndefined();
    expect(week[3].attributes('disabled')).toBeDefined();
    expect(week[6].attributes('disabled')).toBeDefined();
  });

  it('marks the selected day', () => {
    const marked = mountStrip('2026-08-18').findAll('[aria-current="date"]');

    expect(marked).toHaveLength(1);
    expect(marked[0].attributes('aria-label')).toContain('18 август');
  });

  it('renders half a year of history', () => {
    expect(weekBlocks(mountStrip())).toHaveLength(26);
  });

  it('moves the selection a day back on wheel over the gesture area', () => {
    const area = document.createElement('div');
    const wrapper = mountStrip('2026-08-19', area);

    area.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-18']]);
  });

  it('does not move the selection into the future', () => {
    const area = document.createElement('div');
    const wrapper = mountStrip('2026-08-19', area);

    area.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('extends history back to the selected day', () => {
    const wrapper = mountStrip('2025-08-19');

    expect(numbers(wrapper, 0)).toEqual(['18', '19', '20', '21', '22', '23', '24']);
    expect(wrapper.find('[aria-current="date"]').attributes('aria-label')).toContain('19 август');
  });
});
