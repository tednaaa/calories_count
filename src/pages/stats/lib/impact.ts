import type { WeightRecord } from '@/shared/db';
import type { DateKey } from '@/shared/lib';
import { daysBetween, formatNumber } from '@/shared/lib';

export const KCAL_PER_KG = 7700;
export const IMPACT_WINDOW_DAYS = 28;
export const SOLID_COVERAGE = 0.7;

const MIN_WEIGH_INS = 3;
const MIN_SPAN_DAYS = 14;
const MIN_TRACKED_DAYS = 14;
const TYPICAL_NOISE_KG = 0.7;
const MIN_NOISE_KG = 0.5;
const POINTS_TO_MEASURE_NOISE = 5;
const EXTRA_WEIGH_INS = 4;

export interface WeightPoint {
  day: number;
  kg: number;
}

export interface Trend {
  slope: number;
  intercept: number;
  noise: number;
  slopeError: number;
}

export interface Shortfall {
  weighIns: number;
  spanDays: number;
  trackedDays: number;
}

export interface Projection {
  weighIns: number;
  error: number;
}

export interface Impact {
  weighIns: number;
  trackedDays: number;
  countedDays: number;
  coverage: number;
  averageIntake: number;
  expectedPerWeek: number;
  actualPerWeek: number;
  realTdee: number;
  realTdeeError: number;
  projection: Projection | null;
}

export type ImpactResult
  = | { ready: true; impact: Impact }
    | { ready: false; shortfall: Shortfall };

export interface ImpactInput {
  days: DateKey[];
  totals: Map<DateKey, number>;
  weights: WeightRecord[];
  estimatedTdee: number;
}

export function toPoints(weights: WeightRecord[], days: DateKey[]): WeightPoint[] {
  const first = days[0];
  const last = days[days.length - 1];

  return weights
    .filter(record => record.date >= first && record.date <= last)
    .map(record => ({ day: daysBetween(first, record.date), kg: record.kg }));
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function measureNoise(points: WeightPoint[], slope: number, intercept: number): number {
  if (points.length < POINTS_TO_MEASURE_NOISE) {
    return TYPICAL_NOISE_KG;
  }

  const squares = points.reduce((sum, point) => sum + (point.kg - intercept - slope * point.day) ** 2, 0);

  return Math.max(MIN_NOISE_KG, Math.sqrt(squares / (points.length - 2)));
}

export function fitTrend(points: WeightPoint[]): Trend | null {
  if (points.length < 2) {
    return null;
  }

  const meanDay = mean(points.map(point => point.day));
  const meanKg = mean(points.map(point => point.kg));
  const spread = points.reduce((sum, point) => sum + (point.day - meanDay) ** 2, 0);

  if (spread === 0) {
    return null;
  }

  const covariance = points.reduce((sum, point) => sum + (point.day - meanDay) * (point.kg - meanKg), 0);
  const slope = covariance / spread;
  const intercept = meanKg - slope * meanDay;
  const noise = measureNoise(points, slope, intercept);

  return { slope, intercept, noise, slopeError: noise / Math.sqrt(spread) };
}

export function evenSpreadError(noise: number, weighIns: number, windowDays: number): number {
  return noise / Math.sqrt(weighIns * windowDays ** 2 / 12);
}

function project(trend: Trend, weighIns: number, currentError: number): Projection | null {
  const more = weighIns + EXTRA_WEIGH_INS;
  const error = evenSpreadError(trend.noise, more, IMPACT_WINDOW_DAYS) * KCAL_PER_KG;

  return error < currentError ? { weighIns: more, error } : null;
}

function findShortfall(points: WeightPoint[], trackedDays: number): Shortfall {
  const days = points.map(point => point.day);
  const span = days.length ? Math.max(...days) - Math.min(...days) : 0;

  return {
    weighIns: Math.max(0, MIN_WEIGH_INS - points.length),
    spanDays: Math.max(0, MIN_SPAN_DAYS - span),
    trackedDays: Math.max(0, MIN_TRACKED_DAYS - trackedDays),
  };
}

export function analyzeImpact({ days, totals, weights, estimatedTdee }: ImpactInput): ImpactResult {
  const finishedDays = days.slice(0, -1);
  const intakes = finishedDays.map(date => totals.get(date) ?? 0).filter(kcal => kcal > 0);
  const points = toPoints(weights, days);
  const shortfall = findShortfall(points, intakes.length);
  const trend = fitTrend(points);

  if (!trend || shortfall.weighIns || shortfall.spanDays || shortfall.trackedDays) {
    return { ready: false, shortfall };
  }

  const averageIntake = mean(intakes);
  const realTdeeError = trend.slopeError * KCAL_PER_KG;

  return {
    ready: true,
    impact: {
      weighIns: points.length,
      trackedDays: intakes.length,
      countedDays: finishedDays.length,
      coverage: intakes.length / finishedDays.length,
      averageIntake,
      expectedPerWeek: (averageIntake - estimatedTdee) * 7 / KCAL_PER_KG,
      actualPerWeek: trend.slope * 7,
      realTdee: averageIntake - trend.slope * KCAL_PER_KG,
      realTdeeError,
      projection: project(trend, points.length, realTdeeError),
    },
  };
}

export function roundKcal(kcal: number): number {
  return Math.round(kcal / 10) * 10;
}

export function formatKcal(kcal: number): string {
  return formatNumber(roundKcal(kcal));
}

export function formatRate(kgPerWeek: number): string {
  const rounded = Math.round(kgPerWeek * 100) / 100;
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';

  return `${sign}${Math.abs(rounded).toFixed(2).replace('.', ',')} кг/нед`;
}
