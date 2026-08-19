import type { DateKey } from '@/shared/lib';
import { formatNumber } from '@/shared/lib';

export const KCAL_PER_KG = 7700;

const HEADROOM = 1.1;

export interface DayTotal {
  date: DateKey;
  kcal: number;
}

export interface WeekSummary {
  total: number;
  average: number;
  trackedDays: number;
  deviation: number;
}

export function weekTotals(days: DateKey[], totals: Map<DateKey, number>): DayTotal[] {
  return days.map(date => ({ date, kcal: totals.get(date) ?? 0 }));
}

export function summarizeWeek(days: DayTotal[], target: number): WeekSummary {
  const tracked = days.filter(day => day.kcal > 0);
  const total = tracked.reduce((sum, day) => sum + day.kcal, 0);

  return {
    total,
    trackedDays: tracked.length,
    average: tracked.length ? Math.round(total / tracked.length) : 0,
    deviation: total - target * tracked.length,
  };
}

export function chartScale(days: DayTotal[], target: number): number {
  return Math.round(Math.max(target, ...days.map(day => day.kcal), 1) * HEADROOM);
}

export function formatDeviation(deviation: number): string {
  if (deviation === 0) {
    return 'ровно по цели';
  }

  const kilograms = (Math.abs(deviation) / KCAL_PER_KG).toFixed(2).replace('.', ',');
  const direction = deviation < 0 ? 'дефицит' : 'профицит';

  return `${direction} ${formatNumber(Math.abs(deviation))} ккал ≈ ${kilograms} кг`;
}
