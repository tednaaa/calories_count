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

function mountReady(overrides: Partial<Impact> = {}) {
  return mount(DietImpact, { props: { result: { ready: true, impact: { ...impact, ...overrides } }, formulaTdee: 2836 } });
}

describe('вывод о влиянии питания', () => {
  it('сравнивает ожидаемый темп с фактическим', () => {
    const text = mountReady().text();

    expect(text).toContain('−0,40 кг/нед');
    expect(text).toContain('−0,20 кг/нед');
  });

  it('показывает реальный расход с погрешностью рядом с формульным', () => {
    const text = mountReady().text();

    expect(text).toContain('≈ 2 620');
    expect(text).toContain('± 240 ккал');
    expect(text).toContain('2 840 ккал');
  });

  it('говорит, на чём держится точность и что даст ещё пара взвешиваний', () => {
    expect(mountReady().text()).toContain('По 9 взвешиваниям; при 13 будет ± 190 ккал. Еда записана за 27 из 27 дней.');
  });

  it('предупреждает о дырявых записях еды', () => {
    expect(mountReady().text()).not.toContain('меньше чем за 70 %');
    expect(mountReady({ coverage: 0.5 }).text()).toContain('меньше чем за 70 %');
  });

  it('без данных перечисляет, чего не хватает', () => {
    const text = mount(DietImpact, {
      props: { result: { ready: false, shortfall: { weighIns: 2, spanDays: 0, trackedDays: 5 } }, formulaTdee: 2836 },
    }).text();

    expect(text).toContain('2 взвешивания');
    expect(text).toContain('5 дней с записями еды');
    expect(text).not.toContain('между первым и последним');
  });
});
