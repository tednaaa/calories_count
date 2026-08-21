import type { CustomItem } from '@/entities/entry';
import type { Entry } from '@/shared/db';
import { nextEntry } from '@/entities/entry';
import { buildCustomFood } from '@/entities/food';
import { db } from '@/shared/db';

export async function keepEntryAsFood(current: Entry, item: CustomItem, qty: number): Promise<void> {
  const food = buildCustomFood({ name: item.name, kcal: item.kcalPerPortion, photo: item.photo }, Date.now());

  await db.transaction('rw', db.customFoods, db.entries, async () => {
    await db.customFoods.add(food);
    await db.entries.put({ ...nextEntry(current, item, qty), foodId: food.id, photo: undefined });
  });
}
