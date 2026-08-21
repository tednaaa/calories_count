import type { CartItem, CustomItem } from './entry';
import type { Entry } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { db } from '@/shared/db';
import { shiftDateKey, toDateKey } from '@/shared/lib';
import { buildCustomEntry, buildEntries, nextEntry, rankFoodIdsByFrequency } from './entry';

export function entriesOfDay(date: DateKey): Promise<Entry[]> {
  return db.entries.where({ date }).sortBy('createdAt');
}

export function entriesFrom(date: DateKey): Promise<Entry[]> {
  return db.entries.where('date').aboveOrEqual(date).toArray();
}

export async function addEntries(date: DateKey, items: CartItem[]): Promise<void> {
  await db.entries.bulkAdd(buildEntries(date, items, Date.now()));
}

export async function addCustomEntry(date: DateKey, item: CustomItem): Promise<void> {
  await db.entries.add(buildCustomEntry(date, item, Date.now()));
}

export async function removeEntry(id: string): Promise<void> {
  await db.entries.delete(id);
}

export async function restoreEntry(entry: Entry): Promise<void> {
  await db.entries.put(entry);
}

export function loadEntry(id: string): Promise<Entry | undefined> {
  return db.entries.get(id);
}

export async function saveEntry(current: Entry, item: CustomItem, qty: number): Promise<void> {
  await db.entries.put(nextEntry(current, item, qty));
}

export async function frequentFoodIds(days = 30, limit = 8): Promise<string[]> {
  const from = shiftDateKey(toDateKey(), -(days - 1));

  return rankFoodIdsByFrequency(await entriesFrom(from), limit);
}
