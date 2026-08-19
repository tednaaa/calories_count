import type { CartItem } from '@/entities/entry';
import type { Food } from '@/entities/food';
import { formatNumber, pluralize } from '@/shared/lib';

export function toCartItem(food: Food, qty: number): CartItem {
  return { foodId: food.id, name: food.name, kcalPerPortion: food.kcal, qty };
}

export function cartQty(items: CartItem[], foodId: string): number {
  return items.find(item => item.foodId === foodId)?.qty ?? 0;
}

export function withCartItem(items: CartItem[], item: CartItem): CartItem[] {
  if (item.qty < 1) {
    return items.filter(existing => existing.foodId !== item.foodId);
  }

  if (items.some(existing => existing.foodId === item.foodId)) {
    return items.map(existing => (
      existing.foodId === item.foodId ? { ...existing, qty: item.qty } : existing
    ));
  }

  return [...items, item];
}

export function cartKcal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.kcalPerPortion, 0);
}

export function cartSummary(items: CartItem[]): string {
  const positions = pluralize(items.length, ['позиция', 'позиции', 'позиций']);

  return `${items.length} ${positions} · ${formatNumber(cartKcal(items))} ккал`;
}
