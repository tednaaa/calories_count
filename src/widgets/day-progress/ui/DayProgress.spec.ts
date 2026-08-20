import { mount } from '@vue/test-utils';
import DayProgress from './DayProgress.vue';

function mountRing(eaten: number, target: number, compact = false) {
  return mount(DayProgress, { props: { eaten, target, compact } });
}

describe('кольцо прогресса дня', () => {
  it('показывает съеденное и цель', () => {
    const wrapper = mountRing(1200, 2410);

    expect(wrapper.text()).toContain('1 200');
    expect(wrapper.text()).toContain('2 410');
  });

  it('под целью показывает остаток', () => {
    const wrapper = mountRing(1200, 2000);

    expect(wrapper.text()).toContain('Осталось');
    expect(wrapper.text()).toContain('800');
  });

  it('над целью показывает перебор', () => {
    const wrapper = mountRing(2500, 2000);

    expect(wrapper.text()).toContain('Перебор');
    expect(wrapper.text()).not.toContain('Осталось');
    expect(wrapper.text()).toContain('500');
  });

  it('дуга перебора появляется только при превышении', () => {
    expect(mountRing(1200, 2000).findAll('circle')).toHaveLength(2);
    expect(mountRing(2500, 2000).findAll('circle')).toHaveLength(3);
  });

  it('не заполняет кольцо больше чем на круг', () => {
    const wrapper = mountRing(10_000, 2000);
    const progress = wrapper.findAll('circle')[1];

    expect(Number(progress.attributes('stroke-dashoffset'))).toBe(0);
  });

  it('свёрнутое кольцо уступает место ленте', () => {
    const svg = mountRing(1200, 2000, true).find('svg');

    expect(svg.classes()).toContain('size-24');
    expect(svg.classes()).not.toContain('size-44');
  });

  it('свёрнутое кольцо не повторяет цель дважды', () => {
    expect(mountRing(1200, 2000, true).text()).not.toContain('из 2 000 ккал');
    expect(mountRing(1200, 2000).text()).toContain('из 2 000 ккал');
  });

  it('свёрнутое кольцо сохраняет все три числа', () => {
    const text = mountRing(1200, 2000, true).text();

    expect(text).toContain('Съедено');
    expect(text).toContain('Осталось');
    expect(text).toContain('Цель');
  });

  it('не падает при нулевой цели', () => {
    const wrapper = mountRing(500, 0);

    expect(wrapper.text()).toContain('500');
  });
});
