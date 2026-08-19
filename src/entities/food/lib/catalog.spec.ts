import { activeFoods, foodById, foods, photoUrl, searchFoods } from './catalog';
import { categories } from './categories';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const categoryIds = new Set<string>(categories.map(category => category.id));

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
  it('находит блюдо', () => {
    expect(foodById('coffee-black')?.name).toBe('Кофе чёрный');
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

describe('searchFoods', () => {
  it('без запроса возвращает весь активный каталог', () => {
    expect(searchFoods('')).toHaveLength(activeFoods.length);
  });

  it('ищет по названию без учёта регистра', () => {
    expect(searchFoods('КОФЕ').map(food => food.id)).toContain('coffee-black');
  });

  it('ищет по тегам', () => {
    expect(searchFoods('курица').map(food => food.id)).toContain('rice-chicken');
  });

  it('фильтрует по категории', () => {
    expect(searchFoods('', 'drinks').every(food => food.category === 'drinks')).toBe(true);
  });

  it('совмещает запрос и категорию', () => {
    expect(searchFoods('рис', 'drinks')).toEqual([]);
  });
});

describe('photoUrl', () => {
  it('ведёт в public/foods', () => {
    expect(photoUrl(foods[0])).toBe(`/foods/${foods[0].photo}`);
  });
});
