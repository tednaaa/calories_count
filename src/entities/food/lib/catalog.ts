import type { Food } from './types';

export const foods: Food[] = [
  { id: 'sugar-spoon', name: 'Сахар, ложка', kcal: 20, photo: 'sugar-spoon.webp', category: 'drinks', tags: ['кофе', 'чай'] },
  { id: 'angus-kebab', name: 'Ангус-кебаб', kcal: 850, photo: 'angus-kebab.webp', category: 'outside', tags: ['мясо', 'лаваш'] },
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
