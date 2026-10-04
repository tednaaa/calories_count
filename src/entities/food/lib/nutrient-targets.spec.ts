import { meetsTarget, nutrientTargets, targetRatio } from './nutrient-targets';

const targets = nutrientTargets(85, 2400);

function target(id: string) {
  return targets.find(item => item.id === id)!;
}

describe('nutrientTargets', () => {
  it('derives protein from body weight', () => {
    expect(target('protein')).toMatchObject({ goal: 'reach', amount: 136 });
  });

  it('derives sugar as a tenth of calories', () => {
    expect(target('sugars')).toMatchObject({ goal: 'limit', amount: 60 });
  });
});

describe('meetsTarget', () => {
  it('meets a reach target once reached', () => {
    expect(meetsTarget(136, target('protein'))).toBe(true);
    expect(meetsTarget(135, target('protein'))).toBe(false);
  });

  it('meets a limit target until exceeded', () => {
    expect(meetsTarget(60, target('sugars'))).toBe(true);
    expect(meetsTarget(61, target('sugars'))).toBe(false);
  });
});

describe('targetRatio', () => {
  it('divides eaten by target', () => {
    expect(targetRatio(30, target('sugars'))).toBe(0.5);
  });

  it('does not divide by zero', () => {
    expect(targetRatio(30, { ...target('sugars'), amount: 0 })).toBe(0);
  });
});
