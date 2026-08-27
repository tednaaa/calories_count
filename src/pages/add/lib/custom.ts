import type { CustomFoodInput } from '@/entities/food';
import type { DateKey } from '@/shared/lib';
import { addCustomEntry, buildEntries } from '@/entities/entry';
import { buildCustomFood } from '@/entities/food';
import { db } from '@/shared/db';
import { toCartItem } from './cart';

export async function addCustomFoodToDay(date: DateKey, input: CustomFoodInput): Promise<void> {
  const now = Date.now();
  const food = buildCustomFood(input, now);

  await db.transaction('rw', db.customFoods, db.entries, async () => {
    await db.customFoods.add(food);
    await db.entries.bulkAdd(buildEntries(date, [toCartItem(food, 1)], now));
  });
}

export async function addCustomOnceToDay(date: DateKey, input: CustomFoodInput): Promise<void> {
  await addCustomEntry(date, {
    name: input.name,
    kcalPerPortion: input.kcal,
    grams: input.grams,
    basis: input.basis,
    photo: input.photo,
  });
}
