import type { Food } from './types';
import { activeFoods, foodById, foods, matchesQuery, photoUrl, searchFoods } from './catalog';
import { categories } from './categories';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const categoryIds = new Set<string>(categories.map(category => category.id));

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

describe('целостность каталога', () => {
  it('идентификаторы уникальны', () => {
    const ids = foods.map(food => food.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('идентификаторы записаны слагом', () => {
    const invalid = foods.filter(food => !SLUG.test(food.id));

    expect(invalid.map(food => food.id)).toEqual([]);
  });

  it('калорийность — целое положительное число', () => {
    const invalid = foods.filter(food => !Number.isInteger(food.kcal) || food.kcal <= 0);

    expect(invalid.map(food => food.id)).toEqual([]);
  });

  it('категории существуют', () => {
    const invalid = foods.filter(food => !categoryIds.has(food.category));

    expect(invalid.map(food => food.id)).toEqual([]);
  });

  it('имя файла фотографии совпадает с идентификатором', () => {
    const invalid = foods.filter(food => food.photo !== `${food.id}.webp`);

    expect(invalid.map(food => food.id)).toEqual([]);
  });

  it('названия не пустые', () => {
    const invalid = foods.filter(food => food.name.trim() === '');

    expect(invalid.map(food => food.id)).toEqual([]);
  });
});

describe('foodById', () => {
  it('находит каждое блюдо каталога', () => {
    const missing = foods.filter(food => foodById(food.id) !== food);

    expect(missing.map(food => food.id)).toEqual([]);
  });

  it('возвращает undefined для удалённого блюда', () => {
    expect(foodById('was-deleted-long-ago')).toBeUndefined();
  });
});

describe('activeFoods', () => {
  it('не содержит заархивированных', () => {
    expect(activeFoods.every(food => !food.archived)).toBe(true);
  });
});

describe('matchesQuery', () => {
  it('без запроса подходит любое блюдо', () => {
    expect(matchesQuery(coffee, '')).toBe(true);
  });

  it('ищет по названию без учёта регистра', () => {
    expect(matchesQuery(coffee, 'КОФЕ')).toBe(true);
  });

  it('ищет по вхождению подстроки', () => {
    expect(matchesQuery(coffee, 'молок')).toBe(true);
  });

  it('не замечает пробелов вокруг запроса', () => {
    expect(matchesQuery(coffee, '  кофе  ')).toBe(true);
  });

  it('ищет по тегам', () => {
    expect(matchesQuery(apple, 'фрукт')).toBe(true);
  });

  it('не находит постороннее', () => {
    expect(matchesQuery(apple, 'лобстер')).toBe(false);
  });

  it('отсекает чужую категорию', () => {
    expect(matchesQuery(apple, '', 'drinks')).toBe(false);
  });

  it('совмещает запрос и категорию', () => {
    expect(matchesQuery(coffee, 'кофе', 'snacks')).toBe(false);
  });
});

describe('searchFoods', () => {
  it('без запроса возвращает весь активный каталог', () => {
    expect(searchFoods('')).toEqual(activeFoods);
  });
});

describe('photoUrl', () => {
  it('ведёт в public/foods', () => {
    expect(photoUrl(apple)).toBe('/foods/apple.webp');
  });
});
