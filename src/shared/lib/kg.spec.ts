import { formatKg, parseKg } from './kg';

describe('parseKg', () => {
  it('accepts comma and dot', () => {
    expect(parseKg('85,4')).toBe(85.4);
    expect(parseKg('85.4')).toBe(85.4);
  });

  it('rounds to tenths', () => {
    expect(parseKg('85,46')).toBe(85.5);
  });

  it('trims surrounding spaces', () => {
    expect(parseKg(' 85 ')).toBe(85);
  });

  it('rejects empty and non-numeric input', () => {
    expect(parseKg('')).toBeNull();
    expect(parseKg('восемьдесят')).toBeNull();
  });

  it('rejects weight out of range', () => {
    expect(parseKg('29,9')).toBeNull();
    expect(parseKg('300,1')).toBeNull();
    expect(parseKg('30')).toBe(30);
    expect(parseKg('300')).toBe(300);
  });
});

describe('formatKg', () => {
  it('writes tenths with a comma', () => {
    expect(formatKg(85.4)).toBe('85,4');
  });

  it('does not append zero to whole numbers', () => {
    expect(formatKg(85)).toBe('85');
  });
});
