import { targetConflict, weightToGo } from './weight-goal';

describe('targetConflict', () => {
  it('замечает похудение к весу выше текущего', () => {
    expect(targetConflict('cut', 85, 90)).toContain('похудение');
    expect(targetConflict('cutMild', 85, 85)).toContain('похудение');
  });

  it('замечает набор к весу ниже текущего', () => {
    expect(targetConflict('bulk', 70, 65)).toContain('набор');
  });

  it('молчит, когда цель и целевой вес согласны', () => {
    expect(targetConflict('cut', 85, 78)).toBeNull();
    expect(targetConflict('bulkMild', 70, 75)).toBeNull();
    expect(targetConflict('maintain', 70, 75)).toBeNull();
  });
});

describe('weightToGo', () => {
  it('считает, сколько осталось при похудении', () => {
    expect(weightToGo('cut', 85.4, 78)).toEqual({ reached: false, kg: 7.4 });
  });

  it('считает, сколько осталось при наборе', () => {
    expect(weightToGo('bulk', 70, 75.5)).toEqual({ reached: false, kg: 5.5 });
  });

  it('видит достигнутую цель, даже если её проскочили', () => {
    expect(weightToGo('cutMild', 77.6, 78)).toEqual({ reached: true });
    expect(weightToGo('bulkMild', 76, 75)).toEqual({ reached: true });
  });

  it('при поддержании прощает килограмм в обе стороны', () => {
    expect(weightToGo('maintain', 75.8, 75)).toEqual({ reached: true });
    expect(weightToGo('maintain', 77, 75)).toEqual({ reached: false, kg: 2 });
  });
});
