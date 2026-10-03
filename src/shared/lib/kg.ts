export const WEIGHT_LIMITS = { min: 30, max: 300 } as const;

export function parseKg(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  const kg = Number(text);

  if (text === '' || !Number.isFinite(kg) || kg < WEIGHT_LIMITS.min || kg > WEIGHT_LIMITS.max) {
    return null;
  }

  return Math.round(kg * 10) / 10;
}

export function formatKg(kg: number): string {
  return String(Math.round(kg * 10) / 10).replace('.', ',');
}
