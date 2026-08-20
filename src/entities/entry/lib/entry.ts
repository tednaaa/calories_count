import type { Entry } from '@/shared/db';
import type { DateKey } from '@/shared/lib';

export interface CartItem {
  foodId: string;
  name: string;
  kcalPerPortion: number;
  qty: number;
}

export function buildEntries(date: DateKey, items: CartItem[], now: number): Entry[] {
  return items.map((item, index) => ({
    id: crypto.randomUUID(),
    date,
    createdAt: now + index,
    foodId: item.foodId,
    qty: item.qty,
    kcalPerPortion: item.kcalPerPortion,
    name: item.name,
  }));
}

export interface CustomItem {
  name: string;
  kcalPerPortion: number;
  photo?: string;
}

export function buildCustomEntry(date: DateKey, item: CustomItem, now: number): Entry {
  return {
    id: crypto.randomUUID(),
    date,
    createdAt: now,
    photo: item.photo,
    qty: 1,
    kcalPerPortion: item.kcalPerPortion,
    name: item.name,
  };
}

export const HALF_PORTION = 0.5;

export function increaseQty(qty: number): number {
  return qty < 1 ? 1 : qty + 1;
}

export function decreaseQty(qty: number): number {
  return qty > 1 ? qty - 1 : qty - HALF_PORTION;
}

export function entryKcal(entry: Entry): number {
  return entry.qty * entry.kcalPerPortion;
}

export function totalKcal(entries: Entry[]): number {
  return entries.reduce((sum, entry) => sum + entryKcal(entry), 0);
}

export function totalsByDate(entries: Entry[]): Map<DateKey, number> {
  const totals = new Map<DateKey, number>();

  for (const entry of entries) {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entryKcal(entry));
  }

  return totals;
}

export function rankFoodIdsByFrequency(entries: Entry[], limit: number): string[] {
  const stats = new Map<string, { count: number; lastAt: number }>();

  for (const entry of entries) {
    if (!entry.foodId) {
      continue;
    }

    const current = stats.get(entry.foodId);

    if (current) {
      current.count += 1;
      current.lastAt = Math.max(current.lastAt, entry.createdAt);
    }
    else {
      stats.set(entry.foodId, { count: 1, lastAt: entry.createdAt });
    }
  }

  return [...stats.entries()]
    .sort(([, a], [, b]) => b.count - a.count || b.lastAt - a.lastAt)
    .slice(0, limit)
    .map(([foodId]) => foodId);
}
