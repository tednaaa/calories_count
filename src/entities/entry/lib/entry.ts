import type { CustomDraft } from '@/entities/food';
import type { Basis, Entry } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { draftToCustomFood, servingToDraft } from '@/entities/food';

export interface CartItem {
  foodId: string;
  name: string;
  kcalPerPortion: number;
  grams?: number;
  basis?: Basis;
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
    grams: item.grams,
    basis: item.basis,
    name: item.name,
  }));
}

export interface CustomItem {
  name: string;
  kcalPerPortion: number;
  grams?: number;
  basis?: Basis;
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
    grams: item.grams,
    basis: item.basis,
    name: item.name,
  };
}

export function draftFromEntry(entry: Entry): CustomDraft {
  return {
    name: entry.name,
    ...servingToDraft({ kcal: entry.kcalPerPortion, grams: entry.grams, basis: entry.basis }),
    photo: entry.photo ?? '',
  };
}

export function draftToEntry(draft: CustomDraft): CustomItem | null {
  const food = draftToCustomFood(draft);

  return food && {
    name: food.name,
    kcalPerPortion: food.kcal,
    grams: food.grams,
    basis: food.basis,
    photo: food.photo,
  };
}

export function nextEntry(current: Entry, item: CustomItem, qty: number): Entry {
  return {
    ...current,
    name: item.name,
    kcalPerPortion: item.kcalPerPortion,
    grams: item.grams,
    basis: item.basis,
    photo: item.photo,
    qty,
  };
}

export const HALF_PORTION = 0.5;

export function increaseQty(qty: number): number {
  return qty < 1 ? 1 : qty + 1;
}

export function decreaseQty(qty: number): number {
  return qty > 1 ? qty - 1 : qty - HALF_PORTION;
}

export function toggleQty(qty: number): number {
  return qty > 0 ? 0 : 1;
}

export function entryKcal(entry: Entry): number {
  return entry.qty * entry.kcalPerPortion;
}

export function entryGrams(entry: Entry): number | undefined {
  return entry.grams === undefined ? undefined : entry.qty * entry.grams;
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
