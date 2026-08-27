import { formatAmount, formatServing, portionKcal } from './serving';

describe('formatAmount', () => {
  it('подписывает вес граммами', () => {
    expect(formatAmount(200)).toBe('200 г');
  });

  it('разбивает тысячи пробелом', () => {
    expect(formatAmount(1200)).toBe('1 200 г');
  });

  it('подписывает объём миллилитрами', () => {
    expect(formatAmount(450, 'ml')).toBe('450 мл');
  });
});

describe('portionKcal', () => {
  it('пересчитывает этикетку на вес порции', () => {
    expect(portionKcal({ amount: 100, kcal: 270 }, 130)).toBe(351);
  });

  it('порция размером с базу берёт калорийность как есть', () => {
    expect(portionKcal({ amount: 100, kcal: 270 }, 100)).toBe(270);
  });

  it('округляет до целых', () => {
    expect(portionKcal({ amount: 100, kcal: 270 }, 137)).toBe(370);
  });

  it('считает от любой базы, не только от сотни', () => {
    expect(portionKcal({ amount: 30, kcal: 150 }, 90)).toBe(450);
  });
});

describe('formatServing', () => {
  it('без граммовки показывает только калории', () => {
    expect(formatServing(350)).toBe('350 ккал');
  });

  it('с граммовкой ставит вес перед калориями', () => {
    expect(formatServing(350, 100)).toBe('100 г · 350 ккал');
  });

  it('напиток меряет миллилитрами', () => {
    expect(formatServing(230, 450, 'ml')).toBe('450 мл · 230 ккал');
  });
});
