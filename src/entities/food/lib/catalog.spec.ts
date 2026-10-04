import type { Food } from './types';
import { activeFoods, foodById, foods, matchesQuery, searchFoods } from './catalog';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const coffee: Food = {
  id: 'coffee-milk',
  name: 'Кофе с молоком',
  kcal: 60,
  photo: 'coffee-milk.webp',
  category: 'drinks',
};

const apple: Food = {
  id: 'apple',
  name: 'Яблоко',
  kcal: 80,
  photo: 'apple.webp',
  category: 'snacks',
  tags: ['фрукт'],
};

describe('catalog integrity', () => {
  it('has unique ids', () => {
    const ids = foods.map(food => food.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('writes ids as slugs', () => {
    const invalid = foods.filter(food => !SLUG.test(food.id));

    expect(invalid.map(food => food.id)).toEqual([]);
  });

  it('has positive integer kcal', () => {
    const invalid = foods.filter(food => !Number.isInteger(food.kcal) || food.kcal <= 0);

    expect(invalid.map(food => food.id)).toEqual([]);
  });

  it('names photo files after ids', () => {
    const invalid = foods.filter(food => food.photo !== undefined && food.photo !== `${food.id}.webp`);

    expect(invalid.map(food => food.id)).toEqual([]);
  });

  it('has no empty names', () => {
    const invalid = foods.filter(food => food.name.trim() === '');

    expect(invalid.map(food => food.id)).toEqual([]);
  });
});

describe('foodById', () => {
  it('finds every catalog food', () => {
    const missing = foods.filter(food => foodById(food.id) !== food);

    expect(missing.map(food => food.id)).toEqual([]);
  });
});

describe('activeFoods', () => {
  it('excludes archived foods', () => {
    expect(activeFoods.every(food => !food.archived)).toBe(true);
  });
});

describe('matchesQuery', () => {
  it('matches any food without a query', () => {
    expect(matchesQuery(coffee, '')).toBe(true);
  });

  it('matches name case-insensitively', () => {
    expect(matchesQuery(coffee, 'КОФЕ')).toBe(true);
  });

  it('matches a substring', () => {
    expect(matchesQuery(coffee, 'молок')).toBe(true);
  });

  it('ignores whitespace around the query', () => {
    expect(matchesQuery(coffee, '  кофе  ')).toBe(true);
  });

  it('matches tags', () => {
    expect(matchesQuery(apple, 'фрукт')).toBe(true);
  });

  it('rejects unrelated queries', () => {
    expect(matchesQuery(apple, 'лобстер')).toBe(false);
  });
});

describe('searchFoods', () => {
  it('returns the whole active catalog without a query', () => {
    expect(searchFoods('')).toEqual(activeFoods);
  });

  it('keeps only the selected category', () => {
    expect(searchFoods('', 'drinks')).toEqual(activeFoods.filter(food => food.category === 'drinks'));
  });
});
