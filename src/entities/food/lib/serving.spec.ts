import { formatAmount, formatServing, portionKcal } from './serving';

describe('formatAmount', () => {
  it('labels weight in grams', () => {
    expect(formatAmount(200)).toBe('200 г');
  });

  it('separates thousands with a space', () => {
    expect(formatAmount(1200)).toBe('1 200 г');
  });

  it('labels volume in milliliters', () => {
    expect(formatAmount(450, 'ml')).toBe('450 мл');
  });
});

describe('portionKcal', () => {
  it('scales the label to the portion weight', () => {
    expect(portionKcal({ amount: 100, kcal: 270 }, 130)).toBe(351);
  });

  it('keeps label calories for a portion equal to the basis', () => {
    expect(portionKcal({ amount: 100, kcal: 270 }, 100)).toBe(270);
  });

  it('rounds to whole numbers', () => {
    expect(portionKcal({ amount: 100, kcal: 270 }, 137)).toBe(370);
  });

  it('scales from any basis, not only 100', () => {
    expect(portionKcal({ amount: 30, kcal: 150 }, 90)).toBe(450);
  });
});

describe('formatServing', () => {
  it('shows only calories without an amount', () => {
    expect(formatServing(350)).toBe('350 ккал');
  });

  it('puts the amount before calories', () => {
    expect(formatServing(350, 100)).toBe('100 г · 350 ккал');
  });

  it('measures drinks in milliliters', () => {
    expect(formatServing(230, 450, 'ml')).toBe('450 мл · 230 ккал');
  });
});
