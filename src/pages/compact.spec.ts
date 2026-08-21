import { scrollReserve } from './compact';

const HEADER = 280;

describe('scrollReserve', () => {
  it('ничего не резервирует, когда ленте и так есть куда прокручиваться', () => {
    expect(scrollReserve(HEADER, 900)).toBe(0);
    expect(scrollReserve(HEADER, HEADER)).toBe(0);
  });

  it('добирает запас до высоты шапки, когда лента едва вылезает за экран', () => {
    expect(scrollReserve(HEADER, 40)).toBe(240);
    expect(scrollReserve(HEADER, 1)).toBe(279);
  });
});
