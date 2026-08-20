import type { Food } from './types';

export const foods: Food[] = [
  { id: 'coffee', name: 'Кофе', kcal: 2, photo: 'coffee.webp', category: 'drinks' },
  { id: 'sugar-spoon', name: 'Сахар, ложка', kcal: 20, photo: 'sugar-spoon.webp', category: 'drinks', tags: ['кофе', 'чай'] },
  { id: 'mac-coffee', name: 'Мак кофе', kcal: 90, photo: 'mac-coffee.webp', category: 'drinks' },
  { id: 'candy', name: 'Конфета', kcal: 50, category: 'snacks', tags: ['сладкое'] },
  { id: 'pepsi-zero-sugar', name: 'Pepsi Zero 1 л.', kcal: 4, photo: 'pepsi-zero-sugar.webp', category: 'drinks', tags: ['пепси', 'кола'] },
  { id: 'gorilla-energy-drink', name: 'Gorilla 450 мл', kcal: 230, photo: 'gorilla-energy-drink.webp', category: 'drinks', tags: ['энергетик'] },
  { id: 'angus-kebab', name: 'Ангус-кебаб', kcal: 850, photo: 'angus-kebab.webp', category: 'outside', tags: ['мясо', 'лаваш'] },

  // { id: 'coffee-black', name: 'Кофе чёрный', kcal: 5, photo: 'coffee-black.webp', category: 'drinks' },
  // { id: 'coffee-milk', name: 'Кофе с молоком', kcal: 60, photo: 'coffee-milk.webp', category: 'drinks' },
  // { id: 'tea-black', name: 'Чай чёрный', kcal: 2, photo: 'tea-black.webp', category: 'drinks' },

  // { id: 'egg-boiled', name: 'Яйцо варёное', kcal: 78, photo: 'egg-boiled.webp', category: 'basics' },
  // { id: 'curd', name: 'Творог', kcal: 160, photo: 'curd.webp', category: 'basics', tags: ['молочка'] },
  // { id: 'bread-butter', name: 'Бутерброд с маслом', kcal: 180, photo: 'bread-butter.webp', category: 'basics' },

  // { id: 'rice-beef', name: 'Рис с говядиной', kcal: 620, photo: 'rice-beef.webp', category: 'meals', tags: ['рис', 'мясо'] },
  // { id: 'rice-chicken', name: 'Рис с курицей', kcal: 560, photo: 'rice-chicken.webp', category: 'meals', tags: ['рис', 'курица'] },
  // { id: 'buckwheat-chicken', name: 'Гречка с курицей', kcal: 520, photo: 'buckwheat-chicken.webp', category: 'meals', tags: ['гречка', 'курица'] },
  // { id: 'pasta-meat', name: 'Спагетти с мясом', kcal: 475, photo: 'pasta-meat.webp', category: 'meals', tags: ['паста', 'мясо'] },
  // { id: 'soup-chicken', name: 'Куриный суп', kcal: 250, photo: 'soup-chicken.webp', category: 'meals', tags: ['суп'] },

  // { id: 'chocolate-bar', name: 'Шоколадка', kcal: 250, photo: 'chocolate-bar.webp', category: 'snacks' },
  // { id: 'nuts-handful', name: 'Орехи, горсть', kcal: 180, photo: 'nuts-handful.webp', category: 'snacks' },
  // { id: 'apple', name: 'Яблоко', kcal: 80, photo: 'apple.webp', category: 'snacks', tags: ['фрукт'] },
  // { id: 'banana', name: 'Банан', kcal: 100, photo: 'banana.webp', category: 'snacks', tags: ['фрукт'] },

  // { id: 'shawarma', name: 'Шаурма', kcal: 700, photo: 'shawarma.webp', category: 'outside' },
];

const byId = new Map(foods.map(food => [food.id, food]));

export function foodById(id: string): Food | undefined {
  return byId.get(id);
}

export function photoUrl(food: Food): string {
  return `/foods/${food.photo}`;
}

export const activeFoods: Food[] = foods.filter(food => !food.archived);

export function matchesQuery(food: { name: string; tags?: string[] }, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return food.name.toLowerCase().includes(needle)
    || food.tags?.some(tag => tag.toLowerCase().includes(needle)) === true;
}

export function searchFoods(query: string, category?: string): Food[] {
  return activeFoods.filter(food => (
    (!category || food.category === category) && matchesQuery(food, query)
  ));
}
