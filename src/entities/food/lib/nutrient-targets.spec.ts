import { meetsTarget, nutrientTargets, targetRatio } from './nutrient-targets';

const targets = nutrientTargets(85, 2400);

function target(id: string) {
  return targets.find(item => item.id === id)!;
}

describe('nutrientTargets', () => {
  it('считает белок от веса тела', () => {
    expect(target('protein')).toMatchObject({ goal: 'reach', amount: 136 });
  });

  it('считает сахар как десятую долю калорий', () => {
    expect(target('sugars')).toMatchObject({ goal: 'limit', amount: 60 });
  });

  it('клетчатку и соль держит на общих нормах', () => {
    expect(target('fiber')).toMatchObject({ goal: 'reach', amount: 30 });
    expect(target('salt')).toMatchObject({ goal: 'limit', amount: 5 });
  });

  it('подписывает цели по-русски', () => {
    expect(target('protein').name).toBe('Белки');
  });
});

describe('meetsTarget', () => {
  it('цель набрать выполнена, когда добрал', () => {
    expect(meetsTarget(136, target('protein'))).toBe(true);
    expect(meetsTarget(135, target('protein'))).toBe(false);
  });

  it('цель ограничить выполнена, пока не перебрал', () => {
    expect(meetsTarget(60, target('sugars'))).toBe(true);
    expect(meetsTarget(61, target('sugars'))).toBe(false);
  });
});

describe('targetRatio', () => {
  it('делит съеденное на норму', () => {
    expect(targetRatio(30, target('sugars'))).toBe(0.5);
  });

  it('не делит на ноль', () => {
    expect(targetRatio(30, { ...target('sugars'), amount: 0 })).toBe(0);
  });
});
