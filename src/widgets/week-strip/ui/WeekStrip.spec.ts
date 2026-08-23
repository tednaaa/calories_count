import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import WeekStrip from './WeekStrip.vue';

function mountStrip(selected = '2026-08-19') {
  return mount(WeekStrip, { props: { modelValue: selected } });
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

describe('лента недели', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 19, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('показывает неделю с понедельника по воскресенье', () => {
    expect(numbers(mountStrip())).toEqual(['17', '18', '19', '20', '21', '22', '23']);
  });

  it('называет сегодня словом, остальные дни — днём недели', () => {
    const week = labels(mountStrip());

    expect(week[2]).toBe('Сегодня');
    expect(week[0]).toBe('пн');
  });

  it('отдаёт выбранный день по тапу', async () => {
    const wrapper = mountStrip();

    await dayButtons(wrapper)[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-18']]);
  });

  it('не пускает в будущее', () => {
    const week = dayButtons(mountStrip());

    expect(week[2].attributes('disabled')).toBeUndefined();
    expect(week[3].attributes('disabled')).toBeDefined();
    expect(week[6].attributes('disabled')).toBeDefined();
  });

  it('помечает выбранный день', () => {
    const marked = mountStrip('2026-08-18').findAll('[aria-current="date"]');

    expect(marked).toHaveLength(1);
    expect(marked[0].attributes('aria-label')).toContain('18 август');
  });

  it('держит наготове полгода истории', () => {
    expect(weekBlocks(mountStrip())).toHaveLength(26);
  });

  it('доматывает историю до выбранного дня', () => {
    const wrapper = mountStrip('2025-08-19');

    expect(numbers(wrapper, 0)).toEqual(['18', '19', '20', '21', '22', '23', '24']);
    expect(wrapper.find('[aria-current="date"]').attributes('aria-label')).toContain('19 август');
  });
});
