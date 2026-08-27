import type { Basis, CustomFood, Grades, Nutrients, Unit } from '@/shared/db';
import { db } from '@/shared/db';

export interface CustomFoodInput {
  name: string;
  barcode?: string;
  kcal: number;
  amount?: number;
  unit?: Unit;
  basis?: Basis;
  nutrients?: Nutrients;
  grades?: Grades;
  photo?: string;
}

export function buildCustomFood(input: CustomFoodInput, now: number): CustomFood {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    barcode: input.barcode,
    kcal: input.kcal,
    amount: input.amount,
    unit: input.unit,
    basis: input.basis,
    nutrients: input.nutrients,
    grades: input.grades,
    photo: input.photo,
    createdAt: now,
    updatedAt: now,
  };
}

export function nextCustomFood(current: CustomFood, input: CustomFoodInput, now: number): CustomFood {
  return {
    ...current,
    name: input.name,
    barcode: input.barcode,
    kcal: input.kcal,
    amount: input.amount,
    unit: input.unit,
    basis: input.basis,
    nutrients: input.nutrients,
    grades: input.grades,
    photo: input.photo,
    updatedAt: now,
  };
}

export function photosById(foods: CustomFood[]): Map<string, string | undefined> {
  return new Map(foods.map(food => [food.id, food.photo]));
}

export function listCustomFoods(): Promise<CustomFood[]> {
  return db.customFoods.orderBy('createdAt').toArray();
}

export function loadCustomFood(id: string): Promise<CustomFood | undefined> {
  return db.customFoods.get(id);
}

export function findCustomFoodByBarcode(barcode: string): Promise<CustomFood | undefined> {
  return db.customFoods.filter(food => food.barcode === barcode).first();
}

export async function createCustomFood(input: CustomFoodInput): Promise<CustomFood> {
  const food = buildCustomFood(input, Date.now());

  await db.customFoods.add(food);

  return food;
}

export async function saveCustomFood(current: CustomFood, input: CustomFoodInput): Promise<void> {
  await db.customFoods.put(nextCustomFood(current, input, Date.now()));
}

export async function removeCustomFood(id: string): Promise<void> {
  await db.customFoods.delete(id);
}
