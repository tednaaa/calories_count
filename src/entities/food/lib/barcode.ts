import type { CustomDraft } from './custom-draft';
import type { Unit } from '@/shared/db';
import { HUNDRED, MAX_AMOUNT, MAX_KCAL, MIN_AMOUNT, MIN_KCAL } from './custom-draft';

const ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = 'product_name,brands,quantity,nutriments';
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

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  quantity?: string;
  nutriments?: Record<string, number | string | undefined>;
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
  kcalPerHundred: number;
  amount?: number;
  unit: Unit;
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

export function toProduct(response: OpenFoodFactsResponse): Product | null {
  const product = response.product;
  const name = (product?.product_name || product?.brands || '').trim();
  const kcal = Math.round(Number(product?.nutriments?.['energy-kcal_100g']));

  if (response.status !== 1 || !name || !(kcal >= MIN_KCAL && kcal <= MAX_KCAL)) {
    return null;
  }

  const packaging = parsePackage(product?.quantity ?? '');

  return { name, kcalPerHundred: kcal, amount: packaging?.amount, unit: packaging?.unit ?? 'g' };
}

export function productToDraft(product: Product): CustomDraft {
  return {
    name: product.name,
    serving: 'hundred',
    unit: product.unit,
    amount: String(HUNDRED),
    kcal: String(product.kcalPerHundred),
    portion: product.amount === undefined ? '' : String(product.amount),
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
