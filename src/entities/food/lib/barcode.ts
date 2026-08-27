import type { CustomDraft } from './custom-draft';
import type { NutrientId } from './nutrients';
import type { Grades, Nutrients, NutriScore, Unit } from '@/shared/db';
import { HUNDRED, MAX_AMOUNT, MAX_KCAL, MIN_AMOUNT, MIN_KCAL } from './custom-draft';

const ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = 'product_name,brands,quantity,nutriments,nutriscore_grade,nova_group';
const KCAL_PER_KJ = 4.184;
const TIMEOUT = 8000;

const packageUnits: Record<string, { unit: Unit; scale: number }> = {
  g: { unit: 'g', scale: 1 },
  gr: { unit: 'g', scale: 1 },
  г: { unit: 'g', scale: 1 },
  гр: { unit: 'g', scale: 1 },
  kg: { unit: 'g', scale: 1000 },
  кг: { unit: 'g', scale: 1000 },
  ml: { unit: 'ml', scale: 1 },
  мл: { unit: 'ml', scale: 1 },
  l: { unit: 'ml', scale: 1000 },
  л: { unit: 'ml', scale: 1000 },
};

const quantityPattern = /^(\d+(?:[.,]\d+)?)\s*(\p{L}+)/u;

const nutrientFields: Record<NutrientId, string> = {
  protein: 'proteins_100g',
  fat: 'fat_100g',
  saturatedFat: 'saturated-fat_100g',
  carbs: 'carbohydrates_100g',
  sugars: 'sugars_100g',
  fiber: 'fiber_100g',
  salt: 'salt_100g',
};

const nutriScores: NutriScore[] = ['a', 'b', 'c', 'd', 'e'];

const MAX_NOVA = 4;

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  quantity?: string;
  nutriments?: Record<string, number | string | undefined>;
  nutriscore_grade?: string;
  nova_group?: number;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

export interface Package {
  amount: number;
  unit: Unit;
}

export interface Product {
  name: string;
  kcalPerHundred?: number;
  amount?: number;
  unit: Unit;
  nutrients?: Nutrients;
  grades?: Grades;
}

export type Lookup
  = | { state: 'found'; product: Product }
    | { state: 'missing' }
    | { state: 'offline' };

export function isBarcode(value: string): boolean {
  return /^\d{8,14}$/.test(value.trim());
}

export function parsePackage(quantity: string): Package | undefined {
  const match = quantityPattern.exec(quantity.trim());
  const measure = match && packageUnits[match[2].toLowerCase()];

  if (!match || !measure) {
    return undefined;
  }

  const amount = Math.round(Number(match[1].replace(',', '.')) * measure.scale);

  return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT ? { amount, unit: measure.unit } : undefined;
}

function toNutrients(nutriments: OpenFoodFactsProduct['nutriments']): Nutrients | undefined {
  const measured = Object.entries(nutrientFields).flatMap(([id, field]) => {
    const value = Number(nutriments?.[field]);

    return Number.isFinite(value) && value >= 0 ? [[id, value] as const] : [];
  });

  return measured.length ? Object.fromEntries(measured) : undefined;
}

function toGrades(product: OpenFoodFactsProduct): Grades | undefined {
  const score = nutriScores.find(grade => grade === product.nutriscore_grade);
  const nova = product.nova_group;
  const grades = {
    ...score && { nutriScore: score },
    ...Number.isInteger(nova) && nova! >= 1 && nova! <= MAX_NOVA && { nova },
  };

  return Object.keys(grades).length ? grades : undefined;
}

function toKcal(nutriments: OpenFoodFactsProduct['nutriments']): number | undefined {
  const printed = Number(nutriments?.['energy-kcal_100g']);
  const joules = Number(nutriments?.['energy-kj_100g']);
  const kcal = Math.round(Number.isFinite(printed) ? printed : joules / KCAL_PER_KJ);

  return kcal >= MIN_KCAL && kcal <= MAX_KCAL ? kcal : undefined;
}

export function toProduct(response: OpenFoodFactsResponse): Product | null {
  const product = response.product;
  const name = (product?.product_name || product?.brands || '').trim();

  if (!product || response.status !== 1 || !name) {
    return null;
  }

  const packaging = parsePackage(product.quantity ?? '');

  return {
    name,
    kcalPerHundred: toKcal(product.nutriments),
    amount: packaging?.amount,
    unit: packaging?.unit ?? 'g',
    nutrients: toNutrients(product.nutriments),
    grades: toGrades(product),
  };
}

export function productToDraft(product: Product): CustomDraft {
  return {
    name: product.name,
    serving: 'hundred',
    unit: product.unit,
    amount: String(HUNDRED),
    kcal: product.kcalPerHundred === undefined ? '' : String(product.kcalPerHundred),
    portion: product.amount === undefined ? '' : String(product.amount),
    nutrients: product.nutrients,
    grades: product.grades,
    photo: '',
  };
}

export async function lookupBarcode(barcode: string): Promise<Lookup> {
  let response: Response;

  try {
    response = await fetch(`${ENDPOINT}/${barcode.trim()}.json?fields=${FIELDS}`, {
      headers: { 'X-User-Agent': `CaloriesCount/${__APP_VERSION__}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
  }
  catch {
    return { state: 'offline' };
  }

  if (!response.ok) {
    return { state: 'offline' };
  }

  const product = toProduct(await response.json().catch(() => ({})));

  return product ? { state: 'found', product } : { state: 'missing' };
}
