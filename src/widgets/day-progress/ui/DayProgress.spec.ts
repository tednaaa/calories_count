import { mount } from '@vue/test-utils';
import DayProgress from './DayProgress.vue';

function mountRing(eaten: number, target: number, compact = false) {
  return mount(DayProgress, { props: { eaten, target, compact } });
}

describe('day progress ring', () => {
  it('shows eaten and target', () => {
    const wrapper = mountRing(1200, 2410);

    expect(wrapper.text()).toContain('1 200');
    expect(wrapper.text()).toContain('2 410');
  });

  it('shows remaining below target', () => {
    const wrapper = mountRing(1200, 2000);

    expect(wrapper.text()).toContain('Осталось');
    expect(wrapper.text()).toContain('800');
  });

  it('shows excess above target', () => {
    const wrapper = mountRing(2500, 2000);

    expect(wrapper.text()).toContain('Перебор');
    expect(wrapper.text()).not.toContain('Осталось');
    expect(wrapper.text()).toContain('500');
  });

  it('draws the excess arc only above target', () => {
    expect(mountRing(1200, 2000).findAll('circle')).toHaveLength(2);
    expect(mountRing(2500, 2000).findAll('circle')).toHaveLength(3);
  });

  it('does not fill the ring beyond a full circle', () => {
    const wrapper = mountRing(10_000, 2000);
    const progress = wrapper.findAll('circle')[1];

    expect(Number(progress.attributes('stroke-dashoffset'))).toBe(0);
  });

  it('does not repeat the target in the compact ring', () => {
    expect(mountRing(1200, 2000, true).text()).not.toContain('из 2 000 ккал');
    expect(mountRing(1200, 2000).text()).toContain('из 2 000 ккал');
  });

  it('does not crash on a zero target', () => {
    const wrapper = mountRing(500, 0);

    expect(wrapper.text()).toContain('500');
  });
});
