import { nextCompact } from './compact';

const longList = { scrollTop: 1, scrollable: 900, headerHeight: 280 };
const shortList = { scrollTop: 1, scrollable: 40, headerHeight: 280 };

describe('nextCompact', () => {
  it('сворачивает от любой прокрутки', () => {
    expect(nextCompact(false, longList)).toBe(true);
  });

  it('разворачивает только у самого верха', () => {
    expect(nextCompact(true, { ...longList, scrollTop: 1 })).toBe(true);
    expect(nextCompact(true, { ...longList, scrollTop: 0 })).toBe(false);
  });

  it('не сворачивается, когда после этого прокручивать станет нечего', () => {
    expect(nextCompact(false, shortList)).toBe(false);
  });

  it('свёрнутую не разворачивает от осевшей прокрутки', () => {
    expect(nextCompact(true, shortList)).toBe(true);
  });
});
