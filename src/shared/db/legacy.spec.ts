import { renameGrams } from './legacy';

describe('renameGrams', () => {
  it('переносит старый вес порции в новое поле', () => {
    expect(renameGrams({ id: 'cheese', grams: 130 })).toEqual({ id: 'cheese', amount: 130 });
  });

  it('переносит вес и внутри этикетки', () => {
    expect(renameGrams({ grams: 130, basis: { grams: 100, kcal: 270 } })).toEqual({
      amount: 130,
      basis: { amount: 100, kcal: 270 },
    });
  });

  it('не трогает уже перенесённые записи', () => {
    expect(renameGrams({ amount: 130, basis: { amount: 100, kcal: 270 } })).toEqual({
      amount: 130,
      basis: { amount: 100, kcal: 270 },
    });
  });

  it('не выдумывает вес записям без него', () => {
    expect(renameGrams({ id: 'pie', kcal: 350 })).toEqual({ id: 'pie', kcal: 350 });
  });
});
