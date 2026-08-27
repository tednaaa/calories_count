import { formatNutrient, portionNutrients, scaleNutrients, sumNutrients } from './nutrients';

const label = { protein: 0, fat: 0, carbs: 12, sugars: 12, fiber: 0, salt: 0 };

describe('scaleNutrients', () => {
  it('пересчитывает всё разом', () => {
    expect(scaleNutrients({ protein: 10, carbs: 20 }, 2)).toEqual({ protein: 20, carbs: 40 });
  });

  it('оставляет один знак после запятой', () => {
    expect(scaleNutrients({ salt: 1.07 }, 1.3)).toEqual({ salt: 1.4 });
  });

  it('не выдумывает то, чего в этикетке нет', () => {
    expect(scaleNutrients({ protein: 10 }, 2)).toEqual({ protein: 20 });
  });

  it('без этикетки молчит', () => {
    expect(scaleNutrients(undefined, 2)).toBeUndefined();
  });
});

describe('portionNutrients', () => {
  it('пересчитывает этикетку на порцию', () => {
    expect(portionNutrients({ amount: 100, kcal: 50, nutrients: label }, 450))
      .toEqual({ protein: 0, fat: 0, carbs: 54, sugars: 54, fiber: 0, salt: 0 });
  });

  it('у блюда без питательности ничего не считает', () => {
    expect(portionNutrients({ amount: 100, kcal: 270 }, 130)).toBeUndefined();
  });
});

describe('sumNutrients', () => {
  it('складывает записи за день', () => {
    expect(sumNutrients([{ protein: 10, sugars: 2 }, { protein: 5, sugars: 3 }]))
      .toEqual({ protein: 15, sugars: 5 });
  });

  it('пропускает записи без данных', () => {
    expect(sumNutrients([{ protein: 10 }, undefined])).toEqual({ protein: 10 });
  });

  it('считает только то, что кто-то указал', () => {
    expect(sumNutrients([{ protein: 10 }, { sugars: 4 }])).toEqual({ protein: 10, sugars: 4 });
  });

  it('на пустом дне молчит', () => {
    expect(sumNutrients([undefined, undefined])).toBeUndefined();
  });
});

describe('formatNutrient', () => {
  it('пишет целые без хвоста', () => {
    expect(formatNutrient(54)).toBe('54 г');
  });

  it('дробные с запятой', () => {
    expect(formatNutrient(1.25)).toBe('1,3 г');
  });
});
