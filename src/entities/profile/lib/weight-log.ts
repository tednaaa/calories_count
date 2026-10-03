import type { WeightRecord } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { db } from '@/shared/db';
import { toDateKey } from '@/shared/lib';

export function nextWeightRecord(existing: WeightRecord | undefined, date: DateKey, kg: number, now: number): WeightRecord {
  return { ...existing, date, kg, createdAt: now };
}

export async function logWeight(kg: number, now: number): Promise<void> {
  const date = toDateKey(new Date(now));
  const existing = await db.weightLog.where('date').equals(date).first();

  await db.weightLog.put(nextWeightRecord(existing, date, kg, now));
}
