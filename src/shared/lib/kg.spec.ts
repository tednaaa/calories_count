import { formatKg, parseKg } from './kg';

describe('parseKg', () => {
  it('понимает запятую и точку', () => {
    expect(parseKg('85,4')).toBe(85.4);
    expect(parseKg('85.4')).toBe(85.4);
  });

  it('округляет до десятых', () => {
    expect(parseKg('85,46')).toBe(85.5);
  });

  it('пропускает пробелы по краям', () => {
    expect(parseKg(' 85 ')).toBe(85);
  });

  it('отвергает пустое и нечисловое', () => {
    expect(parseKg('')).toBeNull();
    expect(parseKg('восемьдесят')).toBeNull();
  });

  it('отвергает вес вне пределов', () => {
    expect(parseKg('29,9')).toBeNull();
    expect(parseKg('300,1')).toBeNull();
    expect(parseKg('30')).toBe(30);
    expect(parseKg('300')).toBe(300);
  });
});

describe('formatKg', () => {
  it('пишет десятые через запятую', () => {
    expect(formatKg(85.4)).toBe('85,4');
  });

  it('не дописывает ноль к целому', () => {
    expect(formatKg(85)).toBe('85');
  });
});
