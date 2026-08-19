import type { CartItem } from './entry';
import type { Entry } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { db } from '@/shared/db';
import { shiftDateKey, toDateKey } from '@/shared/lib';
import { buildEntries, rankFoodIdsByFrequency } from './entry';

export function entriesOfDay(date: DateKey): Promise<Entry[]> {
  return db.entries.where({ date }).sortBy('createdAt');
}

export function entriesFrom(date: DateKey): Promise<Entry[]> {
  return db.entries.where('date').aboveOrEqual(date).toArray();
}

export async function addEntries(date: DateKey, items: CartItem[]): Promise<void> {
  await db.entries.bulkAdd(buildEntries(date, items, Date.now()));
}

export async function removeEntry(id: string): Promise<void> {
  await db.entries.delete(id);
}

export async function restoreEntry(entry: Entry): Promise<void> {
  await db.entries.put(entry);
}

export async function setEntryQty(id: string, qty: number): Promise<void> {
  await db.entries.update(id, { qty });
}

export async function frequentFoodIds(days = 30, limit = 8): Promise<string[]> {
  const from = shiftDateKey(toDateKey(), -(days - 1));

  return rankFoodIdsByFrequency(await entriesFrom(from), limit);
}
