export const categories = [
  { id: 'meals', name: 'Основное' },
  { id: 'basics', name: 'Простое' },
  { id: 'drinks', name: 'Напитки' },
  { id: 'snacks', name: 'Перекусы' },
  { id: 'outside', name: 'Не дома' },
] as const;

export type CategoryId = typeof categories[number]['id'];

const namesById = new Map<string, string>(categories.map(({ id, name }) => [id, name]));

export function categoryName(id: CategoryId): string {
  return namesById.get(id) ?? id;
}
