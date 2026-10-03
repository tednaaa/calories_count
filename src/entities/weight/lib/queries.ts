import type { WeightRecord } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { db } from '@/shared/db';

export function weightsFrom(date: DateKey): Promise<WeightRecord[]> {
  return db.weightLog.where('date').aboveOrEqual(date).sortBy('date');
}

export function lastWeight(): Promise<WeightRecord | undefined> {
  return db.weightLog.orderBy('date').last();
}
