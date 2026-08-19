import { formatNumber, pluralize } from './pluralize';

const servings: [string, string, string] = ['порция', 'порции', 'порций'];

describe('pluralize', () => {
  it('should use the one form for numbers ending in 1', () => {
    expect(pluralize(1, servings)).toBe('порция');
    expect(pluralize(21, servings)).toBe('порция');
    expect(pluralize(101, servings)).toBe('порция');
  });

  it('should use the few form for numbers ending in 2-4', () => {
    expect(pluralize(2, servings)).toBe('порции');
    expect(pluralize(4, servings)).toBe('порции');
    expect(pluralize(22, servings)).toBe('порции');
  });

  it('should use the many form for the teens', () => {
    expect(pluralize(11, servings)).toBe('порций');
    expect(pluralize(12, servings)).toBe('порций');
    expect(pluralize(14, servings)).toBe('порций');
  });

  it('should use the many form for everything else', () => {
    expect(pluralize(0, servings)).toBe('порций');
    expect(pluralize(5, servings)).toBe('порций');
    expect(pluralize(100, servings)).toBe('порций');
  });
});

describe('formatNumber', () => {
  it('should group thousands with a space', () => {
    expect(formatNumber(3720)).toBe('3 720');
    expect(formatNumber(12000)).toBe('12 000');
  });

  it('should leave numbers under a thousand untouched', () => {
    expect(formatNumber(950)).toBe('950');
  });
});
